import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Sunburst from 'sunburst-chart';
import { FetchDataService } from './services/fetch-data.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true
})
export class AppComponent implements OnInit {
  @ViewChild('sbChart', { static: true }) sbChartEl: ElementRef;
  data: any;
  private sunburstChart: any; // Store the Sunburst chart instance

  constructor(private userActivityService: FetchDataService, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.userActivityService.getUserActivity().subscribe(data => {
      this.data = data;
      this.buildSunburst();
    });
  }

  countLeafNodes(node): number {
    if (!node.children || node.children.length === 0) {
      return 1; // Leaf node itself counts as one
    }
    return node.children.reduce((sum, child) => sum + this.countLeafNodes(child), 0);
  }

  loadDynamicData(node) {
    const params: any = {};
    if (node) {
      const depth = node.__dataNode.depth;

      // Extract parent values dynamically to avoid deep nesting
      const parentData = node.__dataNode.parent?.data;
      const grandparentData = node.__dataNode.parent?.data?.__dataNode?.parent?.data;

      switch (depth) {
        case 1:
          params.typeIdentifier = node.name;
          break;
        case 2:
          params.typeIdentifier = parentData?.name;
          params.year = node.name;
          break;
        case 3:
          params.typeIdentifier = grandparentData?.name;
          params.year = parentData?.name;
          params.month = node.name;
          break;
        case 4:
          params.typeIdentifier = grandparentData?.__dataNode?.parent?.data?.name;
          params.year = grandparentData?.name;
          params.month = parentData?.name;
          params.org = node.name;
          break;
        default:
          return; // No further data loading needed
      }

      this.userActivityService.getUserActivity(params).subscribe(children => {
        if (children && children.length) {
          this.updateNodeInHierarchy(this.data, node, children);
          this.buildSunburst(); 
          this.sunburstChart.focusOnNode(node);// Re-render the chart with updated data
        }
      });
    }
  }

  updateNodeInHierarchy(hierarchy, targetNode, newChildren) {
    function findAndUpdate(node) {
      if (node.name === targetNode.name && node.__dataNode?.depth === targetNode.__dataNode?.depth && node.count === targetNode.count) {
        if (!node.children) {
          node.children = [];
        }
        node.children.push(...newChildren);
        return true; // Node updated
      }
      return node.children?.some(child => findAndUpdate(child));
    }

    findAndUpdate(hierarchy);
  }

  reset() {
    this.sbChartEl.nativeElement.innerHTML = ''; // Clear the chart
    this.loadInitialData(); // Reload data
  }

  buildSunburst() {
    const baseColors = d3.schemeSet3;
    const colorScale = d3.scaleOrdinal(baseColors);

    if (this.sunburstChart) {
      this.sbChartEl.nativeElement.innerHTML = ''; // Clear the chart
      
    }

    console.log('----data',this.data)
    this.sunburstChart = Sunburst()
      .data(this.data)
      .label('name')
      .size('count')
      .showTooltip(() => true)
      .showLabels(true)
      .radiusScaleExponent(1)
      .minSliceAngle(.4)
      .transitionDuration(1000)
      .tooltipContent((d, node) => `Size: <i>${this.countLeafNodes(node)}</i>`)
      .handleNonFittingLabel((label, availablePx) => {
        const numFitChars = Math.round(availablePx / 5);
        return label && numFitChars > 5 ? `${label.toString().slice(0, numFitChars - 3)}...` : null;
      })
      .color(node => colorScale(node.name))
      .excludeRoot(true)
      .onClick((node, event) => {
        if (node) {
          this.sunburstChart.focusOnNode(node); // Trigger drill-down
          if (!node?.children || node?.children.length === 0) {
            this.loadDynamicData(node);
          }
        } else {
          // this.reset(); // Reset chart if no node is selected
        }
      });

    this.sunburstChart(this.sbChartEl.nativeElement);
  }
}
