import React, { useEffect, useState } from "react"
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import { ThemeProvider, SvgWrapper } from "@nivo/core";
import { BoxLegendSvg } from "@nivo/legends";
import TSNE from "tsne-js"
import { Loader } from "semantic-ui-react"
import { useOrdinalColorScale } from "@nivo/colors";
import { Button } from 'semantic-ui-react'


const cachedOutputs = {}

const generateTSNELayout = (data) => {
    const model = new TSNE({
        dim: 2,
        perplexity: 30.0,
        earlyExaggeration: 4.0,
        learningRate: 100.0,
        nIter: 100,
        metric: "euclidean",
    })

    model.init({
        data: data,
        type: "dense",
    })

    model.run()

    return model.getOutputScaled()
}

export default ({ taskId, result, completed }) => {
    if (!completed) {
        return false
    }

    const getCaption = (row) => {
        if (row.properties.name) {
            return row.properties.name
        }

        if (row.properties.title) {
            return row.properties.title
        }

        if (row.properties.id) {
            return row.properties.id
        }

        return row.identity

    }

    const [rawData, setRawData] = useState([])
    const [hiddenIds, setHiddenIds] = useState([])
    const [toggleCaption, setToggleCaption] = useState(false)
    const colors = useOrdinalColorScale({ scheme: "nivo" }, "id");

    const theme = {
        tooltip: {
            container: {
                background: 'rgba(51, 51, 51, 0.9)',
                color: '#fff',
                fontSize: '12px',
                borderRadius: '0',
                boxShadow: 'none',
                padding: '10px 14px'
            },
        },
    };

    const NodeCaption = ({
        node,
        x,
        y,
        size,
        color,
        blendMode,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        onClick,
    }) => (
        <g transform={`translate(${x},${y})`}>
            <text fontSize="10px"> 
                {node.data.caption}
            </text>
            <circle
                r={size / 2}
                fill={color}
                style={{ mixBlendMode: blendMode }}
                onMouseEnter={onMouseEnter}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
            />
        </g>
    )

    const NodeWithoutCaption = ({
        node,
        x,
        y,
        size,
        color,
        blendMode,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        onClick,
    }) => (
        <g transform={`translate(${x},${y})`}>
            <circle
                r={size / 2}
                fill={color}
                style={{ mixBlendMode: blendMode }}
                onMouseEnter={onMouseEnter}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
            />
        </g>
    )

    const handleToggle = () => {
        setToggleCaption(!toggleCaption)
    }


    useEffect(
        () => {
            if (cachedOutputs[taskId]) {
                setRawData(cachedOutputs[taskId])
            } else {
                const scaledOutput = generateTSNELayout(
                    result.rows.map((row) => row.embedding),
                )
                let viz_input = result.rows
                    .map((row, i) => ({ label: row.labels[0], x: scaledOutput[i][0], y: scaledOutput[i][1], caption: getCaption(row) }))
                    .reduce((result, item) => {
                        if (result.filter(element => element.id === item.label).length > 0) {
                            result.find(element => element.id === item.label).data.push({ x: item.x, y: item.y, caption: item.caption })
                        }
                        else { result.push({ id: item.label, data: [{ x: item.x, y: item.y, caption: item.caption }] }) };
                        return result
                    }, [])
                cachedOutputs[taskId] = viz_input
                setRawData(viz_input)
            }
        },
        [taskId],
    )

    if (rawData.length === 0) {
        return <Loader active={true} inline='centered'>Rendering</Loader>
    }

    return (
        <div
        style={{
          display: "grid",
          gridTemplateColumns: "80% 20%",
          height: "50em"
        }}
      >
        <div style={{ height: '50em' }}>
            <ResponsiveScatterPlot
                data={rawData.filter((item) => !hiddenIds.includes(item.id))}
                margin={{ top: 40, right: 140, bottom: 70, left: 90 }}
                xScale={{ type: 'linear', min: -1, max: 1 }}
                yScale={{ type: 'linear', min: -1, max: 1 }}
                blendMode="multiply"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    orient: 'bottom',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                }}
                axisLeft={{
                    orient: 'left',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                }}

                tooltip={(node) => {
                    return (
                        <div style={theme.tooltip.container}>
                            <strong>
                                {`Label: ${node.node.data.serieId}`}
                                <br />
                            </strong>
                            {`Id: ${node.node.data.caption}`}
                        </div>
                    )
                }}
                renderNode={toggleCaption ? NodeCaption : NodeWithoutCaption}
            />
            </div>
            <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column"
                  }}>
            <div style={{paddingTop:"40px"}}>
            <Button toggle active={toggleCaption} onClick={handleToggle}>
                Toggle captions
            </Button>
            </div>
            <ThemeProvider>
                <SvgWrapper
                    height={400}
                    width={80}
                    margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
                >
                    <BoxLegendSvg
                        anchor="center"
                        data={rawData.map((item) => {

                            const color = colors(item);

                            return {
                                color: hiddenIds.includes(item.id) ? "rgba(1, 1, 1, .1)" : color,
                                id: item.id,
                                label: item.id
                            }
                        })}
                        containerWidth={80}
                        containerHeight={400}
                        height={400}
                        width={80}
                        direction="column"
                        itemWidth={50}
                        itemHeight={40}
                        itemsSpacing={15}
                        padding={10}
                        symbolSize={14}
                        symbolShape="circle"
                        onClick={(datum) => {
                            setHiddenIds((state) =>
                                state.includes(String(datum.id))
                                    ? state.filter((item) => item !== datum.id)
                                    : [...state, String(datum.id)]
                            )
                        }}
                    />
                </SvgWrapper>
            </ThemeProvider>
            </div>
        </div>
    )
}
