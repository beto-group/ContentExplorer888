
```datacorejsx
const activeFile = dc.resolvePath("CONTENT EXPLORER 888") || "_RESOURCES/DATACORE/_DONE/CONTENT EXPLORER 888/CONTENT EXPLORER 888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
