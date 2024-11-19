

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import Sunburst from 'sunburst-chart';
import Icicle from 'icicle-chart';

import { FetchDataService } from './services/fetch-data.service';
@Component({
  selector: 'app-root',
  standalone: true,
  providers:[FetchDataService],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild('sbChart', { static: true }) sbChartEl: ElementRef;
  @ViewChild('sbChart2', { static: true }) sbChartEl2: ElementRef;

  loading: boolean = false;

  data:any;
  constructor(private userActivityService:FetchDataService) { }

  ngOnInit() {
    this.fetchAllUserActivity();
  }

  fetchAllUserActivity(): void {
    this.userActivityService.getUserActivity().subscribe(
      (data) => {
        this.data = data;
        // this.buildIcicle(); 
        this.buildSunburst();
      },
      (error) => {
        console.error('Error fetching user activity:', error);
      }
    );
  }

  //  countAllChildren(node) {
  //   if (!node.children || node.children.length === 0) {
  //     return 0; // Leaf nodes have no children
  //   }
  //   return node.children.length + node.children.reduce((sum, child) => sum + this.countAllChildren(child), 0);
  // }

  countLeafNodes(node) {
    if (!node.children || node.children.length === 0) {
      return 1; // Leaf node itself counts as one
    }
    return node.children.reduce((sum, child) => sum + this.countLeafNodes(child), 0);
  }
  
  buildIcicle() {

//     const baseColors = ['#FF5733', '#33FF57', '#3357FF', '#F4D03F', '#8E44AD', '#EC7063', '#58D68D', '#5DADE2', '#AF7AC5', '#F5B041'];
// const colorScale = d3.scaleOrdinal(baseColors);
    
    const baseColors = d3.schemeSet3// You can use other palettes like schemeSet3, schemeTableau10, etc.
  const colorScale = d3.scaleOrdinal(baseColors);
  console.log(this.data)
   
    Icicle()
    .orientation('lr')
    .data(this.data)
    .excludeRoot(true)
    .showLabels(true)
    .tooltipContent((d, node) => `Size: <i>${this.countLeafNodes(node)}</i>`)
    .color((node) => {
        // Access the depth of the node to apply color dynamically
        if (node['depth'] === 2) {
          return colorScale(node.name); // Dynamic color for second level
        }
        return node['depth'] === 1
          ? '#76c7c0' // Static color for first level
          : colorScale(node.name); // Fallback dynamic color
      })(this.sbChartEl.nativeElement);
  }

  buildSunburst() {
    
    const baseColors = d3.schemeSet3// You can use other palettes like schemeSet3, schemeTableau10, etc.
  const colorScale = d3.scaleOrdinal(baseColors);
  console.log(this.data)
   
    Sunburst()
      .data(this.data)
      .label('name')
      .size('size')
      .height(800)
      .maxLevels(2)
      .excludeRoot(true)
      .showTooltip(() => true)
      .showLabels(true)
      .handleNonFittingLabel((label, availablePx) => {
        const numFitChars = Math.round(availablePx / 7); // ~7px per char
        return numFitChars < 5
          ? null
          : `${label.slice(0, Math.round(numFitChars) - 3)}...`;
      })
      .tooltipContent((d, node) => `Size: <i>${this.countLeafNodes(node)}</i>`)

      // .color((d) => d['color'])(this.sbChartEl.nativeElement);
    .color((node) => {
      // Access the depth of the node to apply color dynamically
      // if (node['depth'] === 2) {
        return colorScale(node.name); // Dynamic color for second level
      // }
      // return node['depth'] === 1
      //   ? '#76c7c0' // Static color for first level
      //   : colorScale(node.name); // Fallback dynamic color
    })(this.sbChartEl.nativeElement);

   
  }
}