import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const PixelCanvas = styled('canvas')({
    height: '100%',
    imageRendering: 'crisp-edges'
});

const BarGraph = forwardRef((props, ref) => {
    const {
        // The name to show at the bottom
        name,
        // Wether to show the bottom counters or not.
        hideCounters,
        // Number of bars to display
        count,
        // Function to initialize the bars. Initialy x=>x+1
        initialValues,
        // Function that describes the height of the bars at
        // each point. Once the bars are moved with the swap
        // and write methods, this value gets ignored.
        distributionFunction,
        // The default color of the bars
        color,
        // The colors of the bars when affected by different operstions
        swapColor,
        writeColor,
        compareColor,
        readColor,
        // Visual properties to pass to the graph.
        sx,
        ...remainingProps
    } = props;

    // A reference to the canvas
    const canvas_ref = useRef();
    // A reference to the canvas drawing context
    const ctx_ref = useRef();
    
    // Create a new Uint16Array to store the heights of the bars.
    const create_bars_array = () => {
        if (distributionFunction) {
            return new Uint16Array([...Array(Number(count)).keys()]
                .map((i) => { return Math.min(Math.max(Math.floor(distributionFunction(i, count)), 0), count); } ));
        } else {
            return new Uint16Array(count);            
        }
    };
    
    const create_relative_change_stack = () => {
        return {
            data: new Int16Array(count*2),
            index: 0
        };
    }
    
    // A reference to the array of bars. We don't store it using
    // a state variable to avoid unnecesary relayouts.
    const bars_ref = useRef(create_bars_array());
    const relative_change_stack = useRef(create_relative_change_stack());

    const prev_bars_ref = useRef(new Uint16Array(count*2));
    const current_bars_colors_ref = useRef(new Uint16Array(count));
    
    const reset_bars_state = () => {
        bars_ref.current = create_bars_array();
        prev_bars_ref.current = new Uint16Array(count*2);
        current_bars_colors_ref.current = new Uint16Array(count);
    }
    
    // Draw a single bar identified by its index
    const draw_bar = (idx) => {
        ctx_ref.current.clearRect(idx, 0, 1, canvas_ref.current.height);
        ctx_ref.current.fillRect(idx, canvas_ref.current.height - bars_ref.current[idx], 1, bars_ref.current[idx]);
    };
    
    // Draw all the bars. We should only use this when the canvas first appears, and
    // every time we change the canvas dimensions, as doing so clears the canvas.
    const draw_all = () => {
        ctx_ref.current.fillStyle = color || "black";
        for(let i = 0; i < bars_ref.current.length; i++) draw_bar(i);
    };

    // In our first initialization get the canvas context and draw the entire canvas.
    useEffect(() => {
        ctx_ref.current = canvas_ref.current.getContext('2d');
        const maxheight = bars_ref.current.reduce((x,y) => x>y ? x : y, 0);
        canvas_ref.current.height = maxheight;
        draw_all();
    }, []);
    
    const changed_distribution = useRef(false);    
    useEffect(() => {
        reset_bars_state();
        //bars_ref.current = create_bars_array();
        const maxheight = bars_ref.current.reduce((x,y) => x>y ? x : y, 0);
        canvas_ref.current.height = maxheight;
        changed_distribution.current = false;
        draw_all();
    }, [props.distributionFunction]);

    // If we changed the number of bars.
    useEffect(() => {
        relative_change_stack.current = create_relative_change_stack();
        if (!changed_distribution.current) {
            // If we didn't change the original distribution,
            // then just recalculate the heights of the bars.    
            //bars_ref.current = create_bars_array();
            reset_bars_state();
            const maxheight = bars_ref.current.reduce((x,y) => x>y ? x : y, 0);
            canvas_ref.current.height = maxheight;
        } else if (count < bars_ref.current.length) {
            // If we are removing X elements, then remove the
            // X biggest elements in the array. For that we
            // linearly search for elements from the biggest
            // to the smallest ones.
            let height_to_remove = canvas_ref.current.height;
            while (bars_ref.current.length > count) {
                const index = bars_ref.current.indexOf(height_to_remove);
                if (index != -1)
                    bars_ref.current.splice(index, 1);
                else
                    height_to_remove -= 1;
            }
                
            const maxheight = bars_ref.current.reduce((x,y) => x>y ? x : y, 0);
            canvas_ref.current.height = maxheight;
        } else {
            // If we are adding X elements, then simply add
            // X bars with their correspoding height.
            let new_biggest_height = canvas_ref.current.height;
            for (let x = bars_ref.current.length+1; x <= count; x++) {
                bars_ref.current.push(x);
                new_biggest_height = x;
            }
            canvas_ref.current.height = new_biggest_height;
        }
        draw_all();
    }, [props.count]);

    // The list of bars that are currently drawed with a special color.
    // When we need clear the bars' colors we only need to repaint these
    // bars, and not redraw the entire canvas.
    // Doing so optimizes a fair bit the drawing with big sizes.
    const cleanup_ref = useRef([]);

    const [swaps, setSwaps] = useState(0);
    const [writes, setWrites] = useState(0);
    const [compares, setCompares] = useState(0);
    const [reads, setReads] = useState(0);

    // The methods to modify the canvas that we will expose to outside
    // users through a ref.
    useImperativeHandle(ref, () => ({
        size: count,
        swap: (idxA, idxB) => {
            let interm = bars_ref.current[idxA];
            bars_ref.current[idxA] = bars_ref.current[idxB];
            
            /*let delta = bars_ref.current[idxA] - interm;
            let s = relative_change_stack.current;
            s.data[idxA] += delta;
            s.data[idxB] += -delta;*/
            
            bars_ref.current[idxB] = interm;
            
            current_bars_colors_ref.current[idxA] = 1;
            current_bars_colors_ref.current[idxB] = 1;
            
            //[bars_ref.current[idxA], bars_ref.current[idxB]] = [bars_ref.current[idxB], bars_ref.current[idxA]];

            /*let s = relative_change_stack.current;
            s.data[s.index] = idxA;
            s.data[s.index+1] = idxB;
            s.index += 2;*/
                        
            
                        
            setSwaps(swaps => swaps+1);
            //cleanup_ref.current.push(idxA, idxB);
            changed_distribution.current = true;            
            //ctx_ref.current.fillStyle = swapColor || "green";
            //draw_bar(idxA);
            //draw_bar(idxB);
        },
        write: (idx, x) => {
            bars_ref.current[idx] = x;

            setWrites(writes => writes+1);
            cleanup_ref.current.push(idx);
            changed_distribution.current = true;
            ctx_ref.current.fillStyle = writeColor || "green";

            if (x > canvas_ref.current.height) {
                canvas_ref.current.height = x;
                //draw_all();
            } else {
                //draw_bar(idx);
            }
        },
        compare: (idxA, idxB) => {
            setCompares(compares => compares+1);
            //cleanup_ref.current.push(idxA, idxB);
            //ctx_ref.current.fillStyle = compareColor || "gray";
            //draw_bar(idxA);
            //draw_bar(idxB);
            
            current_bars_colors_ref.current[idxA] = 2;
            current_bars_colors_ref.current[idxB] = 2;

            return bars_ref.current[idxA] - bars_ref.current[idxB];
        },
        read: (idx) => {
            setReads(reads => reads+1);
            cleanup_ref.current.push(idx);
            ctx_ref.current.fillStyle = readColor || "gray";
            //draw_bar(idx);

            return bars_ref.current[idx];
        },
        clear: () => {
            const colors = ["black", "red", "green"];
            
            let s = prev_bars_ref.current;
            for (let i = 0; i < count; i++) {
                let prev_color_i = s[i*2+1];
                let new_color_i = current_bars_colors_ref.current[i];
                let prev_height = s[i*2];
                let new_height = bars_ref.current[i];
                
                if (prev_color_i != new_color_i) {
                    // We have to change the bar color, so we have to redraw it.
                    ctx_ref.current.fillStyle = colors[new_color_i];
                    if (new_height < prev_height) {
                        // If the new bar height is smaller we have to clear the area over it.
                        ctx_ref.current.clearRect(i, canvas_ref.current.height - prev_height, 1, prev_height-new_height);                                                
                    }
                    ctx_ref.current.fillRect(i, canvas_ref.current.height - new_height, 1, new_height);
                } else {
                    // The bar didn't change color, so we can just redraw the section that changed.
                    ctx_ref.current.fillStyle = colors[new_color_i];
                    let delta_height = bars_ref.current[i] - prev_height;   
                    if (delta_height > 0) {
                        // The bar is taller, so we have to draw a new rectangle above the top.
                        ctx_ref.current.fillRect(i, canvas_ref.current.height - new_height, 1, delta_height);
                    } else if (delta_height < 0) {
                        // The bar is smaller, so we have to clear a rectangle below the top.
                        ctx_ref.current.clearRect(i, canvas_ref.current.height - (new_height - delta_height), 1, -delta_height);
                    }
                }
                s[i*2] = bars_ref.current[i];
                s[i*2+1] = new_color_i;
                current_bars_colors_ref.current[i] = 0;
            }
                        
            /*let s = relative_change_stack.current;
            let changed = 0;
            for (let i = 0; i < count; i++) {
                if (s.data[i] > 0) {
                    ctx_ref.current.fillRect(i, canvas_ref.current.height - bars_ref.current[i], 1, s.data[i]);
                    s.data[i] = 0;
                } else if (s.data[i] < 0) {
                    ctx_ref.current.clearRect(i, canvas_ref.current.height - (bars_ref.current[i] - s.data[i]), 1, -s.data[i]);
                    s.data[i] = 0;
                }
            }*/
            
            //console.log(changed + " : " + (changed/count)+"%");
            
            //cleanup_ref.current.forEach(draw_bar);
            //cleanup_ref.current = [];
            
            /*ctx_ref.current.fillStyle = color || "black";
            cleanup_ref.current.forEach(draw_bar);
            cleanup_ref.current = [];*/
        },
        resetCounters: () => {
            setSwaps(0);
            setWrites(0);
            setCompares(0);
            setReads(0);
        }
    }), [props.count]);

	// Este va perfecto, aunque el canvas no tiene un aspect ratio de exactamrnte
    return (<Paper {...remainingProps} sx={{...{ aspectRatio: '1', display: 'flex', flexDirection: 'column' }, ...sx}} elevation={8}>
        <PixelCanvas ref={canvas_ref} width={count}/>
        <div style={{ margin: '10px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <Typography sx={{ flexGrow: 1 }} variant="body1" component="span">{name}</Typography>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', gap: '10px' }}>
                { !hideCounters && <Typography variant="body1" component="span">{swaps} swaps</Typography> }
                <Typography variant="body1" component="span">{writes} writes</Typography>
                { !hideCounters && <Typography variant="body1" component="span">{compares} comparasions</Typography> }
                <Typography variant="body1" component="span">{reads} reads</Typography>
            </div>
        </div>
    </Paper>);

    /*
    { !hideCounters &&
    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-around', gap: '10px' }}>
    <Typography variant="body1" component="span">{swaps} swaps</Typography>
    <Typography variant="body1" component="span">{writes} writes</Typography>
    <Typography variant="body1" component="span">{compares} comparasions</Typography>
    <Typography variant="body1" component="span">{reads} reads</Typography>
    </div>
    }
    */
});

export default BarGraph;
