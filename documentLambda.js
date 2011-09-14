var DOC = {
    url: "/document/1", // where doc is reacheable, primary key for DB (unique)
    htmlFileUrl: "/web/cache/page/documentName", // where file
    name: "DocumentName", //(not a title)
    layout: "layout3Col", // page structure (base template for zoning)
    universe: "cssUnivers1", // css class to be applied on body
    header: "header1", // means includes/header1.ext exist
    footer: "footer1", // means includes/footer1.ext exist
    leftCol: "leftCol1", // means includes/leftCol1.ext exist
    rightCol: {
        template: "baseRightCol", // means template/baseRightCol.ext exist
        content: [
            
        ]
        
    },
    main: [],
    title: "titre du document"
}
