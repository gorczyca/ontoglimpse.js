class Formatter {
    constructor(
        format = 'latex',  // plain, html, latex
        syntax = 'dl',     // dl, manchester
        useLabel = false
    ) {
        this.format = format
        this.syntax = syntax
        this.useLabel = useLabel
    }
}


export { Formatter }