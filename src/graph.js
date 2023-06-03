import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useLayoutEffect } from 'react'
import shuffle from './helper'
import { Button, Stack, Item, Paper } from '@mui/material';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const useEffectPrevious = (f, values) => {
    const ref = useRef();
    useEffect(() => {
        f(ref.current);
        ref.current = values.slice(0);
    }, values);
}

const TestGraph = forwardRef((props, ref) => {
    const canvas_ref = useRef();
    const ctx_ref = useRef();
    const execution = useRef();

    //const bars_ref = useRef(shuffle([...Array(props.count).keys()].map((x) => x + 1)));

    const bars_ref = useRef([...Array(props.count).keys()].map((x) => x + 1));

    const draw_all = () => {
        ctx_ref.current.fillStyle = "black";
        for(let i = 0; i < bars_ref.current.length; i++) draw_bar(i);
    };

    useEffect(() => {
        ctx_ref.current = canvas_ref.current.getContext('2d');
        draw_all();
    }, []);

    useEffect(() => {
        count_ref.current = props.count;
        if (props.count < bars_ref.current.length) {
            // If we are removing X elements, then remove the
            // X biggest elements in the array state.
            // Note that we can't just elminate the X last
            // elements, as we can end up big several bars
            // taller than the canvas height.
            for (let x = bars_ref.current.length; x > props.count; x--)
                bars_ref.current.splice(bars_ref.current.indexOf(x), 1);
        } else {
            // If we are adding X elements, then simply add
            // X bars with their correspoding height.
            let news = props.count - bars_ref.current.length;
            for (let x = bars_ref.current.length+1; x <= props.count; x++)
                bars_ref.current.push(x);
        }
        draw_all();
    }, [props.count]);

    const reset_properties = () => {
        setReads(0);
        setCompares(0);
        setWrites(0);
        setSwaps(0);
    }

    const init_algorithm = () => {
        const algorithm = new props.algorithm(swap, compare, clear, read, write, props.count);
        execution.current = algorithm.execute();
    }

    const reset = () => {
        if (lastTimer.current || requestID.current)
            props.onSimulationEnd();
        cancel_frame();
        props.onSimulationEnd();
        init_algorithm();
        reset_properties();
    }

    useImperativeHandle(ref, () => ({
        reset: () => {
            reset();
            draw_all();
        },
        shuffle: () => {
            reset();
            //shuffle(bars_ref.current);

            //const shuffle_exe = new shuffle

            const algorithm = new shuffle(swap, compare, clear, read, write, props.count);
            execution.current = algorithm.execute();

            next_frame();

            //draw_all();
        },
        play: () => {
            cancel_frame();
            next_frame();
        },
        stop: () => {
            cancel_frame();
        },
        step: () => {
            execution.current.next();
        }
    }));

    const count_ref = useRef(props.count);
    const draw_bar = (idx) => {
        ctx_ref.current.clearRect(idx, 0, 1, props.count);
        ctx_ref.current.fillRect(idx, props.count - bars_ref.current[idx], 1, bars_ref.current[idx]);
    };

    const [swaps, setSwaps] = useState(0);
    const [compares, setCompares] = useState(0);
    const [reads, setReads] = useState(0);
    const [writes, setWrites] = useState(0);

    const cleanup_ref = useRef([]);
    const swap = (idxA, idxB) => {
        let interm = bars_ref.current[idxA];
        bars_ref.current[idxA] = bars_ref.current[idxB];
        bars_ref.current[idxB] = interm;

        setSwaps(swaps => swaps+1);
        cleanup_ref.current.push(idxA, idxB);
        ctx_ref.current.fillStyle = "purple";
        draw_bar(idxA);
        draw_bar(idxB);
    }

    const compare = (idxA, idxB) => {
        ctx_ref.current.fillStyle = "gray";
        draw_bar(idxA);
        draw_bar(idxB);

        setCompares(compares => compares+1);
        cleanup_ref.current.push(idxA, idxB);
        return bars_ref.current[idxA] - bars_ref.current[idxB];
    }

    const read = (idx) => {
        ctx_ref.current.fillStyle = "blue";
        draw_bar(idx);

        setReads(reads => reads+1);
        cleanup_ref.current.push(idx);
        return bars_ref.current[idx];
    }

    const write = (idx, value) => {
        ctx_ref.current.fillStyle = "green";
        bars_ref.current[idx] = value;

        setWrites(writes => writes+1);
        cleanup_ref.current.push(idx);
        draw_bar(idx);
    }

    const clear = () => {
        ctx_ref.current.fillStyle = "black";
        cleanup_ref.current.forEach(draw_bar);
        cleanup_ref.current = [];


    };

    const lastTimer = useRef();
    const requestID = useRef();
    const next_frame = () => {
        lastTimer.current = setTimeout(() => {
            lastTimer.current = null;
            requestID.current = requestAnimationFrame(loop);
        }, props.time);
    }
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

    // If the step size changed and whe where currently requesting new
    // frames, cancel those and request new frames, this time with the
    // correct step size.
    useEffect(() => {
        if (lastTimer.current || requestID.current) {
            cancel_frame();
            next_frame();
        }
    }, [props.time]);

    const before = useRef();
    const loop = (now) => {
        requestID.current = null;

        let elapsed = now - (before.current || now);
        before.current = now;
        let steps = Math.floor(Math.max(elapsed/props.time, 1));

        let finished = false;
        for(let i = 0; i < steps; ++i)
            if (execution.current.next().done)
                finished = true;

        if (!finished) {
            next_frame();
        } else if (props.onSimulationEnd) {
            props.onSimulationEnd();
            init_algorithm();
        }
    }

    useEffect(() => {
        // If we changed the algorithm or the size, reset.
        reset();
    }, [props.algorithm, props.count]);

    return (
            <div id="contender-simulation">
                <div id="contenedor-params">
                    <Stack direction="row" spacing={2} className="simulation-property">
                        <VerticalAlignTopIcon style={{color: 'blue'}} fontSize="small"/>
                        <div>Reads: {reads}</div>
                    </Stack>
                    <Stack direction="row" spacing={2} className="simulation-property">
                        <KeyboardArrowRightIcon style={{color: 'gray'}} fontSize="small"/>
                        <div>Comparasions: {compares}</div>
                    </Stack>
                    <div style={{ height: '5px' }}/>
                    <Stack direction="row" spacing={2} className="simulation-property">
                        <VerticalAlignBottomIcon style={{color: 'green'}} fontSize="small"/>
                        <div>Writes: {writes}</div>
                    </Stack>
                    <Stack direction="row" spacing={2} className="simulation-property">
                        <SwapHorizIcon style={{color: 'purple'}} fontSize="small"/>
                        <div>Swap: {swaps}</div>
                    </Stack>
                </div>
                <Paper id="canvas-div" elevation={4}  sx={{ overflow: "hidden" }}>
                    <canvas ref={canvas_ref} width={props.count} height={props.count}></canvas>
                </Paper>
            </div>
        );
});

export default TestGraph;