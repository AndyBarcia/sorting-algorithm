import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import CanvasBarGraph from './bar-graph';
import { AppBar, Toolbar, FormControl, InputLabel, Select, MenuItem,
    Button, Tooltip, Menu, IconButton, Slider, TextField, Input,
    InputAdornment, Typography, InputBase, Modal } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RedoIcon from '@mui/icons-material/Redo';
import ShuffleIcon from '@mui/icons-material/Shuffle';

import './main.css';

import TestGraph from './graph'

import Algorithms from './algo'

const GrowingDiv = styled('div')({
    flex: '1 1 auto',
});

const NumberInput = (props) => {
    const [text, setText] = useState(props.value);

    return (<TextField
        label={props.label}
        size="small"
        value={text}
        sx={{ minWidth: '80px', width: '10vw', marginLeft: '2vw', marginRight: '2vw'}}
        InputProps={{
            step: props.step,
            min: props.min,
            max: props.max,
            endAdornment: props.units &&
            <InputAdornment position="end">
                <Typography color='white'> {props.units} </Typography>
            </InputAdornment>,
            style: { color: 'white' },
        }}
        InputLabelProps={{
            style: { color: 'white' },
        }}
        onChange={(event) => {
            //if (event.target.value >= props.min)
            let value = event.target.value;
            setText(value);
            if (value && value >= props.min && value <= props.max)
                props.onChange(value);
        }}
        onBlur={(event) => {
            console.log("blur");
            setText(props.value);
        }}
        disabled={props.disabled}
        type="number"
        variant="standard"
    />);
};

function App() {
    const [estado, setEstado] = useState({
        algorithm: Algorithms.bubbleSort
    });

    // https://github.com/mui/material-ui/blob/6e3c7abced49371bd46973a34134a3c2e6eecde6/docs/src/modules/components/AppFrame.js
    const [algorithmMenu, setalgorithmMenu] = useState(null);
    const onAlgorithmMenuOpen = event => {
        setalgorithmMenu(event.currentTarget);
    };
    const onSelectAlgorithm = (algorithm) => {
        setEstado({ algorithm });
        setalgorithmMenu(null);
    };

    const [stepSize, setStepSize] = useState(10);
    const [size, setSize] = useState(50);

    const graph_ref = useRef();
    const onReset = () => {
        graph_ref.current.reset();
    }

    const [playing, setPlaying] = useState(false);
    const onPlayPause = () => {
        if (playing)
            graph_ref.current.stop();
        else
            graph_ref.current.play();
        setPlaying(!playing);
    }

    const onStep = () => {
        graph_ref.current.step();
    }

    return (
            <div id="contenedor_principal">
                <React.Fragment>
                    <AppBar position="sticky">
                        <Toolbar>
                            <IconButton title={playing ? 'Pause' : 'Play'} edge="start" color="inherit" onClick={onPlayPause}>
                                { !playing && <PlayArrowIcon fontSize="small"/> }
                                { playing && <PauseIcon fontSize="small"/> }
                            </IconButton>
                            <IconButton title='Next step' color="inherit" disabled={playing} onClick={onStep}>
                                <RedoIcon fontSize="small"/>
                            </IconButton>
                            <Tooltip title='Change algorithm' enterDelay={300}>
                                <Button
                                    color="inherit"
                                    onClick={onAlgorithmMenuOpen}
                                    disabled={playing}
                                    >
                                    <span>{estado.algorithm.name}</span>
                                    <ExpandMoreIcon fontSize="small"/>
                                </Button>
                            </Tooltip>
                            <Menu
                                id="language-menu"
                                anchorEl={algorithmMenu}
                                open={Boolean(algorithmMenu)}
                                onClose={(_) => setalgorithmMenu(null) }
                                >
                                {Object.entries(Algorithms).map((entry) => (
                                        <MenuItem onClick={(_) => onSelectAlgorithm(entry[1])}>
                                            {entry[1].name}
                                        </MenuItem>
                                        ))}
                            </Menu>

                            <NumberInput
                                label="Step"
                                value={stepSize}
                                min={0.1}
                                max={100}
                                step={1}
                                units='ms'
                                onChange={setStepSize}
                            />
                            <GrowingDiv/>
                            <NumberInput
                                label="Size"
                                value={size}
                                min={10}
                                max={100}
                                step={1}
                                onChange={setSize}
                                disabled={playing}
                            />
                            <IconButton title='Shuffle bars' edge="end" color="inherit" onClick={onReset} disabled={playing}>
                                <ShuffleIcon  fontSize="small"/>
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                </React.Fragment>
                <TestGraph
                    ref={graph_ref}
                    count={size}
                    time={stepSize}
                    algorithm={estado.algorithm}
                    onSimulationEnd={() => setPlaying(false) }/>
            </div>
            );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
