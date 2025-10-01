constructor() {
  this.state = {
    trends: [],
    isEnabled: true
  };
}

handleSelection(e: any, interactives: any, moreProps: any) {
  const state = toObject(interactives, (each: any) => {
    return [
      `trends`,
      each.objects,
    ];
  });
  this.setState(state);
}

onComplete(e: any, newTrends: any, moreProps: any) {
  this.setState(prev => ({
    ...prev,
    trends: newTrends,
    isEnabled: false
  }));
}

onKeyPress(e: any) {
  switch (e.which) {
    case 8:// Backspace
    case 46: { // DEL
      const trends = this.state.trends
        .filter((each: any) => !each.selected);

      this.setState({
        trends,
      });
      break;
    }
  }
}

<ChartCanvas>
  <Chart id={1}>
    <CandlestickSeries />

    <TrendLine
      enabled={this.state.isEnabled}
      ref={this.saveInteractiveNodes("TrendLine", 1)} // See stories for implementation of this
      onComplete={this.onComplete}
      trends={this.state.trends}
    />
  </Chart>
  <InteractiveObjectSelector
    enabled
    getInteractiveNodes={this.getInteractiveNodes} // See stories for implementation of this
    onSelect={this.handleSelection}
  />
</ChartCanvas>
