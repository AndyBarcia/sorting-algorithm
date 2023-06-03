import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Paper, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import BarGraph from './bar-graph'
import shuffle from './helper'

const HighlightedCodeDiv = styled('div')({
    backgroundColor: '#C24641'
});

const AlgoPlayer = forwardRef((props, ref) => {
    const {
        algorithm,
        distributionFunction,
        timeStep,
        count,
        onSimulationEnd,
        ...remainingProps
    } = props;

    // The reference to the bar graph. We can modify it
    // throgh the methods exposed in this object.
    const bar_graph_ref = useRef();

    // The current algorithm instance and its running
    // execution instance
    const algorithm_instance = useRef();
    const execution = useRef();

    // Initialize the current algorithm's execution and reset the counters.
    const init_execution = () => {
        execution.current = algorithm_instance.current.execute();
        bar_graph_ref.current.resetCounters();
    }

    // We threat the shuffling as a special case. We change the execution
    // instance to that of a shuffling algorithm, but we don't actually
    // change the current algorithm_instance.
    const init_shuffle = () => {
        const suffle_instance = new shuffle(bar_graph_ref.current, count);
        execution.current = suffle_instance.execute();
        bar_graph_ref.current.resetCounters();
    }

    // Identification of the timeouts and animations frames
    // that we request. We need them so that we don't
    // accidentally end up with several algorithms executing
    // at the same time after changing state.
    const lastTimer = useRef();
    const requestID = useRef();
    // The time of the last executed frame.
    const before = useRef();
    // Wether an algorithm is being executed or not.
    const playing = useRef(false);

    // Request a new loop frame.
    const next_frame = () => {
        lastTimer.current = setTimeout(() => {
            lastTimer.current = null;
            requestID.current = requestAnimationFrame(loop);
        }, timeStep);
    }

    // Cancel the last reqested frame.
    const cancel_frame = () => {
        if (lastTimer.current) {
            clearTimeout(lastTimer.current);
            lastTimer.current = null;
        }
        if (requestID.current) {
            cancelAnimationFrame(requestID.current);
            requestID.current = null;
        }
        before.current = null;
    }

    const [codeStage, setCodeStage] = useState(0);
    
    // An iteration of the loop.
    const loop = (now) => {
        requestID.current = null;

        // Measure the time elapsed since the last frame and
        // calculate how many steps did we miss.
        let elapsed = now - (before.current || now);
        before.current = now;
        let steps = Math.floor(Math.max(elapsed/timeStep, 1));        

        let finished = false;
        for(let i = 0; i < steps; ++i) {
            let step = execution.current.next();
            setCodeStage(step.value);
            if (step.done) {
                finished = true;
                break;
            }
        }
        
        bar_graph_ref.current.clear();

        if (!finished) {
            next_frame();
        } else {
            if (onSimulationEnd) onSimulationEnd();
            bar_graph_ref.current.clear();
            before.current = null;
            playing.current = false;
        }
    }

    useEffect(() => {
        if (playing.current) {
            cancel_frame();
            next_frame();
        }
    }, [props.timeStep]);

    const [externalUI, setExternalUI] = useState();

    useEffect(() => {
        cancel_frame();
        algorithm_instance.current = new algorithm(bar_graph_ref.current, count);
        setExternalUI(algorithm_instance.current.secondaryUI);
        init_execution();
    }, [props.algorithm, props.count, props.distributionFunction]);

    useImperativeHandle(ref, () => ({
        play: () => {
            if (playing.current) {
                cancel_frame();
            } else {
                init_execution();
                bar_graph_ref.current.clear();
                playing.current = true;
            }
            next_frame();
        },
        step: () => {
            if (!playing.current) {
                init_execution();
                playing.current = true;
            }
            let step = execution.current.next();
            setCodeStage(step.value);
            bar_graph_ref.current.clear();
        },
        stop: () => {
            cancel_frame();
        },
        reset: () => {
            cancel_frame();
            bar_graph_ref.current.clear();
            init_execution();
        },
        shuffle: () => {
            cancel_frame();
            init_shuffle();
            playing.current = true;
            next_frame();
        }
    }));
    
    return (
        <div style={{  }} id="contender-simulation">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginRight: '10px' }}>
                <span>Hola</span>
                { externalUI }
                <Paper sx={{ padding: '10px' }} elevation={8}>
                <Typography variant="body1" sx={{ fontFamily: 'Monospace', whiteSpace: 'pre' }} component="div">
                    {Object.entries(algorithm.code).map((entry) => {
                        if (entry[0] == codeStage) {
                            return (<HighlightedCodeDiv>{entry[1]}</HighlightedCodeDiv>)
                        } else {
                            return (<div>{entry[1]}</div>)
                        }
                    })}
                </Typography>
                </Paper>
            </div>
            <BarGraph distributionFunction={distributionFunction} ref={bar_graph_ref} {...remainingProps} name="Data array" count={count}/>
        </div>
    );
});

export default AlgoPlayer;