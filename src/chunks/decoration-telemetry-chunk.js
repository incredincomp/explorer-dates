function scheduleTelemetryReport(provider) {
    if (!provider['_allocationTelemetryEnabled'] || provider['_telemetryReportTimer']) return;
    provider['_telemetryReportTimer'] = setTimeout(() => {
        provider['_telemetryReportTimer'] = null;
        reportAllocationTelemetry(provider);
        scheduleTelemetryReport(provider);
    }, provider['_telemetryReportInterval']);
}

function reportAllocationTelemetry(provider) {
    const telemetry = provider.getMetrics().allocationTelemetry;
    const totalAllocations = telemetry.decorationPool.allocations +
        telemetry.badgeFlyweight.allocations +
        telemetry.readableFlyweight.allocations;
    const totalReuses = telemetry.decorationPool.reuses +
        telemetry.badgeFlyweight.reuses +
        telemetry.readableFlyweight.reuses;

    if (totalAllocations > 0 || totalReuses > 0) {
        provider['_logger']?.info?.('🧮 Allocation telemetry report', {
            timestamp: new Date().toISOString(),
            pool: {
                allocations: telemetry.decorationPool.allocations,
                reuses: telemetry.decorationPool.reuses,
                reuseRate: telemetry.decorationPool.reusePercent + '%'
            },
            badgeFlyweight: {
                allocations: telemetry.badgeFlyweight.allocations,
                reuses: telemetry.badgeFlyweight.reuses,
                reuseRate: telemetry.badgeFlyweight.reusePercent + '%'
            },
            readableFlyweight: {
                allocations: telemetry.readableFlyweight.allocations,
                reuses: telemetry.readableFlyweight.reuses,
                reuseRate: telemetry.readableFlyweight.reusePercent + '%'
            },
            summary: {
                totalAllocations,
                totalReuses,
                overallReuseRate: totalAllocations + totalReuses > 0
                    ? ((totalReuses / (totalAllocations + totalReuses)) * 100).toFixed(1) + '%'
                    : '0%'
            },
            decorationsProcessed: provider['_metrics'].totalDecorations,
            cacheHitRate: provider.getMetrics().cacheHitRate
        });
    }
}

module.exports = { scheduleTelemetryReport, reportAllocationTelemetry };