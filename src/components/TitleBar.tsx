import { useState, useEffect } from 'react';
import { Minus, X, Maximize2, Minimize2, Flower2 } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const TitleBar = () => {
    const [appWindow, setAppWindow] = useState<any>(null);

    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
            try {
                setAppWindow(getCurrentWindow());
            } catch (e) {
                console.error("Failed to get Tauri window context:", e);
            }
        }
    }, []);
    const [isMaximized, setIsMaximized] = useState(false);

    // Check initial maximized state and listen for changes
    useEffect(() => {
        if (!appWindow) return;

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
            unlisten.then((fn: any) => fn());
        };
    }, [appWindow]);

    const handleMinimize = async () => {
        if (appWindow) await appWindow.minimize();
    };

    const handleMaximize = async () => {
        if (!appWindow) return;
        const maximized = await appWindow.isMaximized();
        if (maximized) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
        // State will be updated by the resize listener
    };

    const handleClose = async () => {
        if (appWindow) await appWindow.close();
    };

    if (!appWindow) return null;

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
