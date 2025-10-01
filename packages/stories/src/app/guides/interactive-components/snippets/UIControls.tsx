
handleBrush(brushCoords: BrushCoords, moreProps: any) {
    const { start, end } = brushCoords;
    const left = Math.min(start.xValue, end.xValue);
    const right = Math.max(start.xValue, end.xValue);

    const low = Math.min(start.yValue, end.yValue);
    const high = Math.max(start.yValue, end.yValue);

    this.setState({
        xExtents: [left, right],
        yExtents: [low, high],
    });
}

handleReset() {
    this.setState({
        suffix: this.state.suffix + 1
    });
}

<ChartCanvas xExtents={xExtents} seriesName={`MSFT_${this.state.suffix}`}>
    <Chart yExtents={yExtents}>
        <CandlestickSeries />

        <ZoomButtons onReset={this.handleReset} />
        <Brush enabled={isEnabled} onBrush={this.handleBrush} />
    </Chart>
    <CrossHairCursor />
</ChartCanvas>
