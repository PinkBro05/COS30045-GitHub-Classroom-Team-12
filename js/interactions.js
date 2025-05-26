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

// Initialize global interactions when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initGlobalTooltip();
});
