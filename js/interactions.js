// Shared interaction utilities for the dashboard

// Global tooltip functionality
let globalTooltip;

function initGlobalTooltip() {
    // Remove existing tooltip if any
    d3.select('body').selectAll('.global-tooltip').remove();
    
    globalTooltip = d3.select('body').append('div')
        .attr('class', 'global-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
}

// Create a tooltip for specific chart (returns tooltip element)
function createTooltip(className = 'chart-tooltip') {
    return d3.select('body').append('div')
        .attr('class', className)
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
}

// Utility functions for common interactions
function showTooltip(tooltip, content, event) {
    tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
    tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip(tooltip) {
    tooltip.transition()
        .duration(500)
        .style('opacity', 0);
}

// Mouse event handlers for interactive elements
function createMouseHandlers(tooltip, dataAccessor) {
    return {
        mouseover: function(event, d) {
            d3.select(this).style('opacity', 1);
            const content = dataAccessor(d, event, this);
            showTooltip(tooltip, content, event);
        },
        mousemove: function(event, d) {
            const content = dataAccessor(d, event, this);
            tooltip.html(content)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        },
        mouseout: function(event, d) {
            d3.select(this).style('opacity', 0.8);
            hideTooltip(tooltip);
        }
    };
}

// Number formatting utilities
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

// Data processing utilities
function processCSVData(data, valueColumn) {
    return data.map(d => ({
        year: +d.YEAR,
        jurisdiction: d.JURISDICTION,
        metric: d.METRIC,
        value: +d[valueColumn] || 0
    })).filter(d => !isNaN(d.year) && !isNaN(d.value));
}

// Shared filter state and functionality
const SharedFilter = {
    currentMetric: 'ALL',
    currentYear: 2023,
    data: null,
    callbacks: []
};

// Add callback for when filter changes
function addFilterCallback(callback) {
    SharedFilter.callbacks.push(callback);
}

// Update filter and notify all charts
function updateFilter(metric, year) {
    SharedFilter.currentMetric = metric;
    SharedFilter.currentYear = year;
    
    // Notify all registered callbacks
    SharedFilter.callbacks.forEach(callback => {
        callback(SharedFilter.currentMetric, SharedFilter.currentYear);
    });
}

// Create shared metric filter UI
function createSharedMetricFilter(data) {
    SharedFilter.data = data;
    
    // Get unique metrics and years
    const metrics = [...new Set(data.map(d => d.metric))].sort();
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
    
    // Add "ALL" option at the beginning of metrics array
    const metricsWithAll = ['ALL', ...metrics];
    
    const filterContainer = d3.select('#metric-filters');
    filterContainer.selectAll('*').remove(); // Clear existing filters
    
    // Create filter container
    const filterDiv = filterContainer
        .append('div')
        .attr('class', 'filter-controls')
        .style('display', 'flex')
        .style('gap', '20px')
        .style('align-items', 'center')
        .style('margin-bottom', '20px');
    
    // Metric filter
    const metricDiv = filterDiv.append('div').attr('class', 'filter-group');
    metricDiv.append('label')
        .text('Metric: ')
        .style('margin-right', '8px')
        .style('font-weight', 'bold');
    
    const metricSelect = metricDiv.append('select')
        .attr('class', 'metric-filter')
        .on('change', function() {
            updateFilter(this.value, SharedFilter.currentYear);
        });
    
    metricSelect.selectAll('option')
        .data(metricsWithAll)
        .join('option')
        .attr('value', d => d)
        .property('selected', d => d === SharedFilter.currentMetric)
        .text(d => formatMetricName(d));
    
    // Year filter
    const yearDiv = filterDiv.append('div').attr('class', 'filter-group');
    yearDiv.append('label')
        .text('Year: ')
        .style('margin-right', '8px')
        .style('font-weight', 'bold');
    
    const yearSelect = yearDiv.append('select')
        .attr('class', 'year-filter')
        .on('change', function() {
            updateFilter(SharedFilter.currentMetric, +this.value);
        });
    
    yearSelect.selectAll('option')
        .data(years)
        .join('option')
        .attr('value', d => d)
        .property('selected', d => d === SharedFilter.currentYear)
        .text(d => d);
}

// Format metric names for display
function formatMetricName(metric) {
    if (metric === 'ALL') {
        return 'All Metrics Combined';
    }
    return metric.replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Initialize global interactions when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initGlobalTooltip();
});
