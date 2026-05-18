const { useState, useEffect } = dc;

function App({ dc, folderPath }) {
    const base = folderPath + "/src";
    const [selectedFile, setSelectedFile] = useState(null);
    const [lastFile, setLastFile] = useState(null);
    
    // Dynamic imports to wire sub-modules cleanly and avoid script caching issues
    const [components, setComponents] = useState(null);
    
    useEffect(() => {
        Promise.all([
            dc.require(`${base}/components/ViewComponent.jsx`),
            dc.require(`${base}/components/ViewComponentBounty.jsx`)
        ]).then(([viewMod, bountyMod]) => {
            setComponents({
                View: viewMod.View,
                ViewBounty: bountyMod.ViewBounty
            });
        }).catch(err => {
            console.error("App sub-modules loading failed:", err);
        });
    }, [folderPath]);

    if (!components) {
        return <div style={{ color: "white", padding: "20px", fontFamily: "sans-serif" }}>Loading Explorer...</div>;
    }

    const { View, ViewBounty } = components;

    function handleBackClick() {
        setLastFile(`${selectedFile}.namzu`);
        setSelectedFile(null);
    }

    if (selectedFile) {
        return <View title={selectedFile} spawnType="fullTab" onBack={handleBackClick} backLabel={selectedFile} folderPath={folderPath} dc={dc} />;
    }

    return <ViewBounty onFileSelect={setSelectedFile} file={lastFile} app={window.app} folderPath={folderPath} dc={dc} />;
}

return { App };


