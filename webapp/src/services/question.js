export class Question {
    constructor({name, label="", placeholder="", type, init="", schema, attributes={}}) {
        this.name = name
        this.label = label
        this.placeholder = placeholder
        this.type = type
        this.init = init
        this.schema = schema
        this.attributes = attributes
    }

    getAttributes() {
        return { name: this.name, placeholder: this.placeholder, ...this.attributes };
    }
}