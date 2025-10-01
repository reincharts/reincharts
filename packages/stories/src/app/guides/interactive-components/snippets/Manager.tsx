constructor() {
    this.state = {
        interactiveStates: {},
    };
}

const handleInteractiveToggle = (type: any, enabled: any) => {
    console.log(`${type} tool ${enabled ? 'enabled' : 'disabled'}`);
};

<InteractiveManager
    onInteractiveToggle={handleInteractiveToggle}
    height={600}
    width={width}
    onSave={(data) => { console.log("Save Data: ", data); }}
    initialStates={this.state.interactiveStates}
>
    <ChartCanvas>
        <Chart id={1}>
            <CandlestickSeries />
            <Drawing />
            <GannFan />
            <FibonacciRetracement />
            <TrendLine />
            <InteractiveYCoordinate isDraggable />
        </Chart>
        <Chart id={2}>
            <LineSeries />
            <Drawing />
            <EquidistantChannel />
            <StandardDeviationChannel />
            <InteractiveText />
        </Chart>
        <CrossHairCursor />
    </ChartCanvas>
</InteractiveManager>