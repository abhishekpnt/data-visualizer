import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import Sunburst from 'sunburst-chart';
import { FetchDataService } from './services/fetch-data.service';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone:true
})
export class AppComponent implements OnInit {
  @ViewChild('sbChart', { static: true }) sbChartEl: ElementRef;
  data: any;
  loading: boolean = false;
  private sunburstChart: any; // Store the Sunburst chart instance

  constructor(private userActivityService: FetchDataService,private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.userActivityService.getUserActivity().subscribe(data => {
      this.data = data;
      this.buildSunburst();
    });
  }


  countLeafNodes(node) {
    if (!node.children || node.children.length === 0) {
      return 1; // Leaf node itself counts as one
    }
    return node.children.reduce((sum, child) => sum + this.countLeafNodes(child), 0);
  }

  loadDynamicData(node) {
    const params: any = {};
    console.log('-=-=-==-=-,node',node)
    if(node){
    if (node.__dataNode.depth === 1) {
      // Type level click
      params.typeIdentifier = node.name;
    } else if (node.__dataNode.depth === 2) {
      // Year level click
      params.typeIdentifier = node.__dataNode.parent.data.name;
      params.year = node.name;
    } else if (node.__dataNode.depth === 3) {
      // Year level click
      params.typeIdentifier = node.__dataNode.parent.data.__dataNode.parent.data.name;
      params.year = node.__dataNode.parent.data.name;
      params.month = node.name;

    }
    else if (node.__dataNode.depth === 4) {
      // Year level click
      params.typeIdentifier = node.__dataNode.parent.data.__dataNode.parent.data.__dataNode.parent.data.name;
      params.year = node.__dataNode.parent.data.__dataNode.parent.data.name;
      params.month = node.__dataNode.parent.data.name;
      params.org=node.name;

    }

    if (node.__dataNode.depth === 5) {
      return

    }

    console.log('Params for API:', params);
  
    this.userActivityService.getUserActivity(params).subscribe(children => {
      // Find and update the corresponding node in the actual data
      this.updateNodeInHierarchy(this.data, node, children);
  
      // this.cdRef.detectChanges();

      // Rebuild Sunburst with the updated data
      this.buildSunburst();
    });
    }
 
  } 

  updateNodeInHierarchy(hierarchy, targetNode, newChildren) {


    console.log(targetNode,newChildren)
    function findAndUpdate(node) {
      if (node.name === targetNode.name && node.__dataNode?.depth === targetNode.__dataNode?.depth && node.count===targetNode.count) {
        // Append new children
        if (!node?.children) {
          node.children = [];
        }
        node.children.push(...newChildren);


        return true; // Node updated
      }
  
      if (node.children) {
        // Recurse into children
        for (let child of node.children) {
          if (findAndUpdate(child)) {
            return true; // Stop searching once updated
          }
        }
      }
  
      return false; // Node not found
    }
  
    findAndUpdate(hierarchy);
    console.log('hierar',hierarchy)
  }
  

  buildSunburst() {
    const baseColors = d3.schemeSet3// You can use other palettes like schemeSet3, schemeTableau10, etc.
    const colorScale = d3.scaleOrdinal(baseColors);
    if (this.sunburstChart) {
      // Destroy the existing chart by clearing the container
      this.sbChartEl.nativeElement.innerHTML = '';
    }
  
    // Create a new Sunburst chart instance and render it
    this.sunburstChart = Sunburst()
      .data(this.data)
      .label('name')
      .size('count')
      .showTooltip(() => true)
      .showLabels(true)
      .tooltipContent((d, node) => `Size: <i>${this.countLeafNodes(node)}</i>`)
      .handleNonFittingLabel((label, availablePx) => {
        const numFitChars = Math.round(availablePx / 5); // ~7px per char
        return numFitChars < 5
          ? null
          : `${label.slice(0, Math.round(numFitChars) - 3)}...`;
      })
      .color((node) => {
        // Access the depth of the node to apply color dynamically
        // if (node['depth'] === 2) {
          return colorScale(node.name); // Dynamic color for second level
        // }
        // return node['depth'] === 1
        //   ? '#76c7c0' // Static color for first level
        //   : colorScale(node.name); // Fallback dynamic color
      })
      .excludeRoot(true)
      .onClick(node => {
        if (!node?.children || node?.children?.length === 0) {
          this.loadDynamicData(node);
        }
      });
  
    // Attach the chart to the DOM
    this.sunburstChart(this.sbChartEl.nativeElement);
  }




  reset(){
    this.sbChartEl.nativeElement.innerHTML = ''; // This removes the current chart from the DOM
  
    // Optionally, reset the data if needed (e.g., if data changes on dynamic load)
    this.data = null; // Optional: clear data if needed, else skip this
    
    // Reinitialize the chart with initial data
    this.loadInitialData(); // 
  }
}
