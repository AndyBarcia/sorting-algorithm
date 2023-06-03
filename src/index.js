import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AppBar, Toolbar, MenuItem, Button, Tooltip, Menu, IconButton, Typography, InputBase } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RedoIcon from '@mui/icons-material/Redo';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import StopIcon from '@mui/icons-material/Stop';

import './main.css';

import AlgoPlayer from './algo-player'

import { algorithms } from './algo'
import shuffle from './helper'

const GrowingDiv = styled('div')({
    flex: '1 1 auto',
});

const ToolbarDiv = styled('div')(({ theme, disabled }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': (!disabled && {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    }),
    padding: theme.spacing(0, 1, 0, 1),
    margin: theme.spacing(0, 1, 0, 1),
    minHeight: `calc(${theme.mixins.toolbar.minHeight}px*0.7)`,
    '& span': (disabled && {
        color: theme.palette.text.disabled
    }),
}));

const ToolbarButton = styled(Button)(({ theme }) => ({
    minHeight: `calc(${theme.mixins.toolbar.minHeight}px*0.7)`,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 1),
        rightMargin: theme.spacing(10),
        width: '6ch',
    },
}));

const ToolbarInput = (props) => {
    const self_ref = useRef();
    const [text, setText] = useState(props.value);

    return (<ToolbarDiv disabled={props.disabled}>
        <Typography variant="body1" component="span">{props.label}</Typography>
        <StyledInputBase
            ref={self_ref}
            //type="number"
            disabled={props.disabled}
            value={text}
            inputProps={{
                min: props.min,
                max: props.max,
            }}
            onChange={(event) => {
                let value = event.target.value;
                if (value === "" || !isNaN(Number(value)))
                    setText(value);
            }}
            onBlur={(event) => {
                if (text) {
                    let clamped = Math.min(Math.max(parseFloat(text), props.min), props.max).toString();
                    setText(clamped);
                    props.onChange(clamped);
                } else {
                    setText(props.value);
                }
            }}
            onKeyUp={(e) => {
                // If pressed enter, the force blur.
                if(e.keyCode == 13) self_ref.current.firstChild.blur();
            }}
            />
        { props.units && <Typography variant="body1" component="span">{props.units}</Typography> }
    </ToolbarDiv>);
};

const redistributionFunctions = [
    {
        name: "Linear",
        function: (i, _) => i+1
    },
    {
        name: "Linear inverse",
        function: (i, count) => count-i
    },
    {
        name: "Sine curve",
        function: (i, count) => Math.ceil(((Math.sin((i/count)*Math.PI*2)+1)/2)*count)
    },
    {
        name: "Mountain range",
        function: (i, count) => Math.ceil(Math.abs(Math.sin((i/count)*Math.PI*4))*count)
    },
    {
        name: "Sawtooth wave",
        function: (i, count) => {
            let x = (i*4 + 1)/count;
            return Math.ceil((x - Math.floor(x))*count + 1);
        }
    },
    {
        name: "Gauss Bell",
        function: (i, count) => {
            // f(i) = count*e^-(scaleFactor*(i-(count/2))/(count))^2
            // Select scaleFactor so that f(0) = 1
            let scaleFactor = Math.sqrt(-4*Math.log(1/count));
            let x = (i-(count/2))/(count/scaleFactor);
            return Math.exp(-x*x)*count;
        }
    },
    {
        name: "Inverse Gauss Bell",
        function: (i, count) => {
            // f(i) = count*e^-(scaleFactor*(i-(count/2))/(count))^2
            // Select scaleFactor so that f(0) = 1
            let scaleFactor = Math.sqrt(-4*Math.log(1/count));
            let x = (i-(count/2))/(count/scaleFactor);
            return (count+1) - Math.exp(-x*x)*count;
        }
    }
]

function App() {
    const [estado, setEstado] = useState({
        algorithm: algorithms.bubbleSort
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

    const [distributionFunction, setDistributionFunction] = useState(redistributionFunctions[0]);
    const [redistributeMenu, setRedistributeMenu] = useState(null);
    const onRedistributeMenuOpen = event => {
        setRedistributeMenu(event.currentTarget);
    };
    const onRedistribute = (f) => {
        setDistributionFunction(f);
        setRedistributeMenu(null);
    }

    const [stepSize, setStepSize] = useState(10);
    const [size, setSize] = useState(10);

    const player_ref = useRef();

    const graph_ref = useRef();
    const onReset = () => {
        player_ref.current.reset();
    }

    const onShuffle = () => {
        player_ref.current.shuffle();
        setPlaying(true);
    }

    const [playing, setPlaying] = useState(false);
    const onPlayPause = () => {
        if (playing)
            player_ref.current.stop();
        else
            player_ref.current.play();
        setPlaying(!playing);
    }

    const onStep = () => {
        player_ref.current.step();
    }

    // TODO, añadir botones para distribuir las barras de manerass
    // predeterminadas, como una distribución x^2, o una x, o un
    // array ordenado al revés.

    return (
            <div id="contenedor_principal">
                <AppBar position="sticky">
                    <Toolbar>
                        <IconButton edge="start" title='Stop' color="inherit" onClick={onReset}>
                            <StopIcon fontSize="small"/>
                        </IconButton>
                        <IconButton title={playing ? 'Pause' : 'Play'} color="inherit" onClick={onPlayPause}>
                            { !playing && <PlayArrowIcon fontSize="small"/> }
                            { playing && <PauseIcon fontSize="small"/> }
                        </IconButton>
                        <IconButton title='Next step' color="inherit" disabled={playing} onClick={onStep}>
                            <RedoIcon fontSize="small"/>
                        </IconButton>
                        <ToolbarButton
                            title="Change algorithm"
                            color="inherit"
                            onClick={onAlgorithmMenuOpen}
                            disabled={playing}
                            >
                            <span>{estado.algorithm.name}</span>
                            <ExpandMoreIcon fontSize="small"/>
                        </ToolbarButton>
                        <Menu
                            id="language-menu"
                            anchorEl={algorithmMenu}
                            open={Boolean(algorithmMenu)}
                            onClose={(_) => setalgorithmMenu(null) }
                            >
                            {Object.entries(algorithms).map((entry) => (
                                <MenuItem key={entry[1].name} onClick={(_) => onSelectAlgorithm(entry[1])}>
                                    {entry[1].name}
                                </MenuItem>
                            ))}
                        </Menu>
                        <ToolbarInput
                            label="Steps"
                            units="ms"
                            min={0.01}
                            max={1000}
                            value={stepSize}
                            onChange={(s) => setStepSize(Number(s))}
                        />
                    <GrowingDiv/>
                    <ToolbarInput
                        label="Size"
                        min={10}
                        max={1000}
                        value={size}
                        onChange={(s) => setSize(Number(s))}
                        disabled={playing}
                    />
                    <IconButton title='Shuffle bars' color="inherit" onClick={onShuffle} disabled={playing}>
                        <ShuffleIcon  fontSize="small"/>
                    </IconButton>
                    <ToolbarButton
                        title="Redistribute bars"
                        color="inherit"
                        onClick={onRedistributeMenuOpen}
                        disabled={playing}
                        >
                        <span>Redistribute</span>
                        <ExpandMoreIcon fontSize="small"/>
                    </ToolbarButton>
                    <Menu
                        id="language-menu"
                        anchorEl={redistributeMenu}
                        open={Boolean(redistributeMenu)}
                        onClose={(_) => setRedistributeMenu(null) }
                        >
                        {Object.entries(redistributionFunctions).map((entry) => (
                            <MenuItem key={entry[1].name} onClick={(_) => onRedistribute(entry[1])}>
                                {entry[1].name}
                            </MenuItem>
                        ))}
                    </Menu>
                </Toolbar>
            </AppBar>

            <AlgoPlayer
                ref={player_ref}
                algorithm={estado.algorithm}
                distributionFunction={distributionFunction.function}
                timeStep={stepSize}
                count={size}
                onSimulationEnd={() => setPlaying(false) }/>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
