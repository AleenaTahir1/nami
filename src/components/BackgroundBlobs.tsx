const BackgroundBlobs = () => {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
                className="blob blob-primary animate-pulse"
                style={{
                    width: '16rem',
                    height: '16rem',
                    top: '15%',
                    left: '10%',
                }}
            />
            <div
                className="blob blob-secondary animate-pulse-slow"
                style={{
                    width: '20rem',
                    height: '20rem',
                    bottom: '10%',
                    right: '5%',
                }}
            />
        </div>
    );
};

export default BackgroundBlobs;
