import { WidgetConfigBuilder } from '../utils/WidgetConfigBuilder.js'

export const WidgetRegistry = {
 // =========================================================
 // 1. KATEGORI (Untuk Sidebar/Filter di Menu Builder)
 // =========================================================
 categories: {
  'line': {
   name: 'Line Charts',
   icon: 'fa-chart-line',
   color: 'text-blue-600',
   bg: 'bg-blue-50',
  },
  'bar': {
   name: 'Bar Charts',
   icon: 'fa-chart-bar',
   color: 'text-emerald-600',
   bg: 'bg-emerald-50',
  },
  'pie': {
   name: 'Pie & Donut',
   icon: 'fa-chart-pie',
   color: 'text-orange-600',
   bg: 'bg-orange-50',
  },
  'scatter': {
   name: 'Scatter & Plot',
   icon: 'fa-braille',
   color: 'text-purple-600',
   bg: 'bg-purple-50',
  },
  'radar': {
   name: 'Radar & Gauge',
   icon: 'fa-compass',
   color: 'text-pink-600',
   bg: 'bg-pink-50',
  },
  'flow': {
   name: 'Tree & Flow',
   icon: 'fa-project-diagram',
   color: 'text-indigo-600',
   bg: 'bg-indigo-50',
  },
  '3d': {
   name: '3D Visualization',
   icon: 'fa-cubes',
   color: 'text-gray-800',
   bg: 'bg-gray-100',
  },
 },

 // =========================================================
 // 2. DEFINISI WIDGET
 // =========================================================
 widgets: {
  // --- LINE GROUP ---
  line_smooth: {
   name: 'Smoothed Line',
   icon: 'fa-bezier-curve',
   category: 'line',
   desc: 'Curved line chart for trends',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'half',
    title: 'Smooth Trend',
    icon: 'fa-bezier-curve',
    echartsOptions: {
     series: [{ type: 'line', smooth: true, areaStyle: { opacity: 0.1 } }],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Mon', value: 150 },
     { label: 'Tue', value: 230 },
     { label: 'Wed', value: 224 },
    ]),
   },
  },
  line_stacked: {
   name: 'Stacked Line',
   icon: 'fa-layer-group',
   category: 'line',
   desc: 'Stacked areas showing total',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'half',
    title: 'Stacked Growth',
    icon: 'fa-layer-group',
    echartsOptions: {
     tooltip: { trigger: 'axis' },
     series: [
      { name: 'A', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' } },
      { name: 'B', type: 'line', stack: 'Total', areaStyle: {}, emphasis: { focus: 'series' } },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Mon', A: 120, B: 220 },
     { label: 'Tue', A: 132, B: 182 },
    ]),
   },
  },
  line_area_large: {
   name: 'Large Scale Area',
   icon: 'fa-chart-area',
   category: 'line',
   desc: 'Optimized for big data',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'full',
    title: 'Big Data View',
    icon: 'fa-chart-area',
    echartsOptions: {
     tooltip: { trigger: 'axis' },
     dataZoom: [{ type: 'inside' }, { type: 'slider' }],
     series: [{ type: 'line', sampling: 'lttb', areaStyle: {} }],
    },
    data_config: WidgetConfigBuilder.staticData(
     Array.from({ length: 50 }, (_, i) => ({ label: i, value: Math.sin(i / 5) * 100 + 50 }))
    ),
   },
  },
  line_multi_x: {
   name: 'Multiple X Axes',
   icon: 'fa-arrows-alt-h',
   category: 'line',
   desc: 'Dual top/bottom axes',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'half',
    title: 'Dual Axis Comparison',
    icon: 'fa-arrows-alt-h',
    echartsOptions: {
     xAxis: [{ type: 'category' }, { type: 'category', position: 'top' }],
     series: [
      { type: 'line', xAxisIndex: 0 },
      { type: 'line', xAxisIndex: 1 },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: '2023', value: 100, value2: 50 },
     { label: '2024', value: 120, value2: 60 },
    ]),
   },
  },
  line_race: {
   name: 'Line Race',
   icon: 'fa-running',
   category: 'line',
   desc: 'Animated racing lines',
   defaultConfig: {
    type: 'chart',
    subtype: 'line',
    width: 'full',
    title: 'Live Race',
    icon: 'fa-running',
    echartsOptions: {
     animationDuration: 5000,
     series: [{ type: 'line', showSymbol: false, endLabel: { show: true } }],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Start', value: 0 },
     { label: 'End', value: 100 },
    ]),
   },
  },

  // --- BAR GROUP ---
  bar_large: {
   name: 'Large Scale Bar',
   icon: 'fa-chart-bar',
   category: 'bar',
   desc: 'High performance bars',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar',
    width: 'full',
    title: 'Massive Bar Data',
    icon: 'fa-chart-bar',
    echartsOptions: { series: [{ type: 'bar', large: true }] },
    data_config: WidgetConfigBuilder.staticData(
     Array.from({ length: 50 }, (_, i) => ({ label: i, value: Math.random() * 100 }))
    ),
   },
  },
  bar_race: {
   name: 'Bar Race',
   icon: 'fa-forward',
   category: 'bar',
   desc: 'Dynamic ranking bars',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar',
    width: 'half',
    title: 'Ranking Race',
    icon: 'fa-forward',
    echartsOptions: {
     xAxis: { max: 'dataMax' },
     yAxis: {
      type: 'category',
      inverse: true,
      animationDuration: 300,
      animationDurationUpdate: 300,
     },
     series: [
      {
       type: 'bar',
       realtimeSort: true,
       seriesLayoutBy: 'column',
       label: { show: true, position: 'right' },
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'A', value: 10 },
     { label: 'B', value: 20 },
     { label: 'C', value: 15 },
    ]),
   },
  },
  bar_multi_y: {
   name: 'Multiple Y Axes',
   icon: 'fa-ruler-vertical',
   category: 'bar',
   desc: 'Mixed units (Sales vs %)',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar',
    width: 'half',
    title: 'Sales vs Margin',
    icon: 'fa-ruler-vertical',
    echartsOptions: {
     yAxis: [
      { type: 'value', name: 'Vol' },
      { type: 'value', name: '%' },
     ],
     series: [
      { type: 'bar', yAxisIndex: 0 },
      { type: 'line', yAxisIndex: 1 },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Jan', value: 500, percent: 20 },
     { label: 'Feb', value: 900, percent: 45 },
    ]),
   },
  },
  mixed_line_bar: {
   name: 'Mixed Line & Bar',
   icon: 'fa-chart-area',
   category: 'bar',
   desc: 'Combine line and bars',
   defaultConfig: {
    type: 'chart',
    subtype: 'mixed',
    width: 'half',
    title: 'Mixed View',
    icon: 'fa-chart-area',
    echartsOptions: { series: [{ type: 'bar' }, { type: 'line' }] },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Q1', value: 100, trend: 10 },
     { label: 'Q2', value: 150, trend: 12 },
    ]),
   },
  },

  // --- PIE GROUP ---
  pie_doughnut_rounded: {
   name: 'Rounded Doughnut',
   icon: 'fa-circle-notch',
   category: 'pie',
   desc: 'Modern doughnut chart',
   defaultConfig: {
    type: 'chart',
    subtype: 'pie',
    width: 'quarter',
    title: 'Distribution',
    icon: 'fa-circle-notch',
    echartsOptions: {
     series: [
      {
       type: 'pie',
       radius: ['40%', '70%'],
       itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { label: 'Direct', value: 335 },
     { label: 'Email', value: 310 },
    ]),
   },
  },
  pie_scroll: {
   name: 'Scrollable Legend',
   icon: 'fa-list-ul',
   category: 'pie',
   desc: 'Pie for many categories',
   defaultConfig: {
    type: 'chart',
    subtype: 'pie',
    width: 'half',
    title: 'Category Breakdown',
    icon: 'fa-list-ul',
    echartsOptions: {
     legend: { type: 'scroll', orient: 'vertical', right: 10 },
     series: [{ type: 'pie', radius: '55%', center: ['40%', '50%'] }],
    },
    data_config: WidgetConfigBuilder.staticData(
     Array.from({ length: 15 }, (_, i) => ({ label: `Cat ${i}`, value: Math.random() * 100 }))
    ),
   },
  },

  // --- SCATTER GROUP ---
  scatter_basic: {
   name: 'Basic Scatter',
   icon: 'fa-braille',
   category: 'scatter',
   desc: 'XY Distribution plot',
   defaultConfig: {
    type: 'chart',
    subtype: 'scatter',
    width: 'half',
    title: 'Correlation',
    icon: 'fa-braille',
    echartsOptions: { xAxis: {}, yAxis: {}, series: [{ type: 'scatter', symbolSize: 20 }] },
    data_config: WidgetConfigBuilder.staticData([
     [10, 8.04],
     [8, 6.95],
     [13, 7.58],
    ]),
   },
  },
  scatter_aggregate: {
   name: 'Aggregate to Bar',
   icon: 'fa-chart-bar',
   category: 'scatter',
   desc: 'Clustered visual map',
   defaultConfig: {
    type: 'chart',
    subtype: 'scatter',
    width: 'half',
    title: 'Aggregated View',
    icon: 'fa-chart-bar',
    echartsOptions: {
     visualMap: { min: 0, max: 100, dimension: 1, orient: 'vertical', right: 10 },
     series: [{ type: 'scatter', symbolSize: 15 }],
    },
    data_config: WidgetConfigBuilder.staticData([
     [5, 10],
     [10, 20],
     [15, 30],
    ]),
   },
  },
  scatter_cluster: {
   name: 'Clustering',
   icon: 'fa-project-diagram',
   category: 'scatter',
   desc: 'Grouped data points',
   defaultConfig: {
    type: 'chart',
    subtype: 'scatter',
    width: 'half',
    title: 'Data Clusters',
    icon: 'fa-project-diagram',
    echartsOptions: {
     series: [
      {
       name: 'G1',
       type: 'scatter',
       data: [
        [1, 1],
        [2, 2],
       ],
      },
      {
       name: 'G2',
       type: 'scatter',
       data: [
        [5, 5],
        [6, 6],
       ],
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([]),
   },
  },

  // --- RADAR & GAUGE ---
  radar_basic: {
   name: 'Basic Radar',
   icon: 'fa-spider',
   category: 'radar',
   desc: 'Multivariate comparison',
   defaultConfig: {
    type: 'chart',
    subtype: 'radar',
    width: 'half',
    title: 'Performance',
    icon: 'fa-spider',
    echartsOptions: {
     radar: { indicator: [{ name: 'K1' }, { name: 'K2' }, { name: 'K3' }, { name: 'K4' }] },
     series: [{ type: 'radar', areaStyle: {} }],
    },
    data_config: WidgetConfigBuilder.staticData({
     legend: {
      data: ['Allocated Budget', 'Actual Spending'],
     },
     indicator: [
      { name: 'Sales', max: 6500 },
      { name: 'Administration', max: 16000 },
      { name: 'Information Technology', max: 30000 },
      { name: 'Customer Support', max: 38000 },
      { name: 'Development', max: 52000 },
      { name: 'Marketing', max: 25000 },
     ],
     data: [
      {
       value: [4200, 3000, 20000, 35000, 50000, 18000],
       name: 'Allocated Budget',
      },
      {
       value: [5000, 14000, 28000, 26000, 42000, 21000],
       name: 'Actual Spending',
      },
     ],
    }),
   },
  },
  gauge_basic: {
   name: 'Speedometer',
   icon: 'fa-tachometer-alt',
   category: 'radar',
   desc: 'Single metric gauge',
   defaultConfig: {
    type: 'chart',
    subtype: 'gauge',
    width: 'quarter',
    title: 'Speed',
    icon: 'fa-tachometer-alt',
    echartsOptions: { series: [{ type: 'gauge' }] },
    data_config: WidgetConfigBuilder.staticData([{ value: 50, name: 'Score' }]),
   },
  },
  gauge_multi: {
   name: 'Multi-Title Gauge',
   icon: 'fa-clock',
   category: 'radar',
   desc: 'Detailed gauge info',
   defaultConfig: {
    type: 'chart',
    subtype: 'gauge',
    width: 'quarter',
    title: 'Detail Gauge',
    icon: 'fa-clock',
    echartsOptions: {
     series: [
      {
       type: 'gauge',
       title: { show: true, offsetCenter: [0, '-20%'] },
       detail: { offsetCenter: [0, '20%'] },
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([{ value: 85, name: 'KPI' }]),
   },
  },

  // --- TREE & FLOW ---
  tree_lr: {
   name: 'L-to-R Tree',
   icon: 'fa-sitemap',
   category: 'flow',
   desc: 'Horizontal hierarchy',
   defaultConfig: {
    type: 'chart',
    subtype: 'tree',
    width: 'full',
    title: 'Organization',
    icon: 'fa-sitemap',
    echartsOptions: {
     series: [
      {
       type: 'tree',
       orient: 'LR',
       symbolSize: 7,
       label: { position: 'left', verticalAlign: 'middle', align: 'right' },
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([
     { name: 'Root', children: [{ name: 'A' }, { name: 'B' }] },
    ]),
   },
  },
  tree_multi: {
   name: 'Multiple Trees',
   icon: 'fa-network-wired',
   category: 'flow',
   desc: 'Forest view',
   defaultConfig: {
    type: 'chart',
    subtype: 'tree',
    width: 'full',
    title: 'Multi Hierarchy',
    icon: 'fa-network-wired',
    echartsOptions: {
     series: [
      { type: 'tree', name: 'T1', left: '5%', right: '60%' },
      { type: 'tree', name: 'T2', left: '50%', right: '10%' },
     ],
    },
    data_config: WidgetConfigBuilder.staticData([{ name: 'Root1' }, { name: 'Root2' }]),
   },
  },
  sankey_basic: {
   name: 'Basic Sankey',
   icon: 'fa-stream',
   category: 'flow',
   desc: 'Flow visualization',
   defaultConfig: {
    type: 'chart',
    subtype: 'sankey',
    width: 'half',
    title: 'Data Flow',
    icon: 'fa-stream',
    echartsOptions: { series: [{ type: 'sankey', layout: 'none' }] },
    data_config: WidgetConfigBuilder.staticData({
     nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
     links: [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: 5 },
     ],
    }),
   },
  },
  sankey_levels: {
   name: 'Sankey Levels',
   icon: 'fa-indent',
   category: 'flow',
   desc: 'Flow with levels',
   defaultConfig: {
    type: 'chart',
    subtype: 'sankey',
    width: 'half',
    title: 'Level Flow',
    icon: 'fa-indent',
    echartsOptions: {
     series: [
      {
       type: 'sankey',
       levels: [
        { depth: 0, itemStyle: { color: '#fbb4ae' } },
        { depth: 1, itemStyle: { color: '#b3cde3' } },
       ],
      },
     ],
    },
    data_config: WidgetConfigBuilder.staticData({
     nodes: [{ name: 'In' }, { name: 'Out' }],
     links: [{ source: 'In', target: 'Out', value: 1 }],
    }),
   },
  },

  // --- 3D GROUP ---
  bar3d_dataset: {
   name: '3D Bar Dataset',
   icon: 'fa-cubes',
   category: '3d',
   desc: 'Requires WebGL',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar3D',
    width: 'half',
    title: '3D Volume',
    icon: 'fa-cubes',
    is3D: true,
    echartsOptions: {
     grid3D: { boxWidth: 200, boxDepth: 80 },
     xAxis3D: {},
     yAxis3D: {},
     zAxis3D: {},
     series: [{ type: 'bar3D' }],
    },
    data_config: WidgetConfigBuilder.staticData([
     [0, 0, 5],
     [1, 0, 10],
     [0, 1, 8],
    ]),
   },
  },
  bar3d_simplex: {
   name: 'Bar3D Noise',
   icon: 'fa-icicles',
   category: '3d',
   desc: 'Simplex noise visual',
   defaultConfig: {
    type: 'chart',
    subtype: 'bar3D',
    width: 'half',
    title: 'Noise Map',
    icon: 'fa-icicles',
    is3D: true,
    echartsOptions: {
     grid3D: {},
     xAxis3D: {},
     yAxis3D: {},
     zAxis3D: {},
     series: [{ type: 'bar3D', itemStyle: { opacity: 0.8 } }],
    },
    data_config: WidgetConfigBuilder.staticData([
     [0, 0, 1],
     [1, 1, 2],
    ]),
   },
  },
  scatter3d_basic: {
   name: 'Scatter 3D',
   icon: 'fa-snowflake',
   category: '3d',
   desc: 'XYZ Points',
   defaultConfig: {
    type: 'chart',
    subtype: 'scatter3D',
    width: 'half',
    title: '3D Plot',
    icon: 'fa-snowflake',
    is3D: true,
    echartsOptions: {
     grid3D: {},
     xAxis3D: {},
     yAxis3D: {},
     zAxis3D: {},
     series: [{ type: 'scatter3D' }],
    },
    data_config: WidgetConfigBuilder.staticData([
     [1, 2, 3],
     [4, 5, 6],
    ]),
   },
  },
  line3d_ortho: {
   name: '3D Line Ortho',
   icon: 'fa-route',
   category: '3d',
   desc: 'Orthographic view',
   defaultConfig: {
    type: 'chart',
    subtype: 'line3D',
    width: 'half',
    title: '3D Path',
    icon: 'fa-route',
    is3D: true,
    echartsOptions: {
     grid3D: { viewControl: { projection: 'orthographic' } },
     xAxis3D: {},
     yAxis3D: {},
     zAxis3D: {},
     series: [{ type: 'line3D', lineStyle: { width: 4 } }],
    },
    data_config: WidgetConfigBuilder.staticData([
     [0, 0, 0],
     [1, 1, 1],
     [2, 0, 2],
    ]),
   },
  },
 },
}
