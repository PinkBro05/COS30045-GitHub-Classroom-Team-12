# COS30045-GitHub-Classroom-Team-12

## Road Safety Data Visualization Dashboard

This interactive dashboard provides comprehensive visualization of road safety infringement data across Australia.

### User Interaction Features

#### Main Dashboard (index.html)
- **Dynamic Filters**: Dropdown menus for metric and year selection that update all charts simultaneously
  - **"All Metrics Combined" Option**: Aggregates data across all metric categories for comprehensive analysis
- **Interactive Map**: Color-coded Australian map with hover tooltips showing state-specific data
- **Stacked Area Chart**: 
  - Hover tooltips for detailed information
  - Clickable legend to filter by state
  - Reference lines marking policy milestones
  - Supports both individual metrics and combined metrics view
- **Companion Bar Chart**: Sorted horizontal bars with precise values, dynamically titled based on selected metric

#### Interactive Elements Across All Pages
- **Tooltips**: Hover over any chart element to see detailed information
- **Responsive Design**: All visualizations adapt to different screen sizes
- **Navigation**: Top menu for seamless page transitions
- **Legend Interactions**: Click legend items to filter/highlight data

#### Chart-Specific Interactions
- **Australia Map**: Hover states for tooltips, color-coded intensity mapping
- **Stacked Area**: Click legend to focus on specific states, reference lines for context
- **Bar Charts**: Hover for exact values, sorted displays for easy comparison
- **Nightingale Rose**: Hover segments for detailed drug usage patterns

### Technical Implementation
- Built with D3.js for interactive visualizations
- Shared interaction utilities in `js/interactions.js`
- Responsive CSS with hover effects and transitions
- Modular chart components for maintainability