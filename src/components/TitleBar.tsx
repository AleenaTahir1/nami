import { useState, useEffect } from 'react';
import { Minus, X, Maximize2, Minimize2, Flower2 } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const TitleBar = () => {
    const appWindow = getCurrentWindow();
    const [isMaximized, setIsMaximized] = useState(false);

    // Check initial maximized state and listen for changes
    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        };

        checkMaximized();

        // Listen for resize events to update maximized state
        const unlisten = appWindow.onResized(async () => {
            const maximized = await appWindow.isMaximized();
            setIsMaximized(maximized);
        });

        return () => {
            unlisten.then(fn => fn());
        };
    }, [appWindow]);

    const handleMinimize = async () => {
        await appWindow.minimize();
    };

    const handleMaximize = async () => {
        const maximized = await appWindow.isMaximized();
        if (maximized) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
        // State will be updated by the resize listener
    };

    const handleClose = async () => {
        await appWindow.close();
    };

    return (
        <header className="titlebar">
            <div className="titlebar-logo">
                <Flower2 size={16} />
                <span>Nami</span>
            </div>
            <div className="titlebar-controls">
                <button
                    className="titlebar-btn"
                    onClick={handleMinimize}
                    aria-label="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    className="titlebar-btn"
                    onClick={handleMaximize}
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                    className="titlebar-btn close"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </header>
    );
};

export default TitleBar;
