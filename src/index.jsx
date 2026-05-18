// ─────────────────────────────────────────────────────────────
// 🚀 CONTENT EXPLORER 888 BOOTSTRAPPER
// ─────────────────────────────────────────────────────────────

async function View(props) {
    const { dc, folderPath } = props;
    const base = folderPath + "/src";
    
    try {
        const [appMod] = await Promise.all([
            dc.require(`${base}/App.jsx`)
        ]);

        return <appMod.App dc={dc} folderPath={folderPath} />;

    } catch (e) {
        console.error("Bootstrap failed:", e);
        return <div>Error loading Content Explorer 888.</div>;
    }
}

return { View };

