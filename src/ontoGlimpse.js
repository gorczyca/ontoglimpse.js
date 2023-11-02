import { SYMBOLS_DICT } from './symbols.js'
import { Formatter } from './formatter.js'
import { OWL, RDF, RDFS } from './namespaces.js'



class Entity {
    // do not use the constructor, but rather the OntologyGraph.EntityFactory
    constructor(node, __og) {
        this.node = node
        this.__og = __og

        this.iri = this.node.value

        let tmpName = this.node.value.split('#').slice(-1)[0]
        let label = this.__og.storeAny(this.node, RDFS('label'), undefined)
        let name = (label && this.__og.__formatter.useLabel) ? label : tmpName

        this.name = name
        this.test = 'test'
    }

    __describeProperties(property) {
        const props = this.__og.storeEach(this.node, property, undefined)

        return props.map((p) => this.__og.entityFactory(p).__describe())
        // if (props.length > 0) {
        //     return this.__og.entityFactory(equiv).__describe()
        // } else
        //     return undefined
    }


    __formatDescribe() {
        const tmpName = this.node.value.split('#').slice(-1)[0]
        const label = this.__og.storeAny(this.node, RDFS('label'), undefined)

        const name = (label && this.__og.__formatter.useLabel) ? label : tmpName

        switch (this.__og.__formatter.format) {
            case 'html':
                // code block
                return `<a href="#${this.node.value}">${name}</a>`
            case 'latex':
                // code block
                return `\\text{${name}}`
            // you can have any number of case statements
            case 'plain':
                return name
            default:
                throw new Error('Wrong format specified: Either "html", "plain" or "latex".')
            // code block
        }

    }

    /**
     * Converts node to its description
     * 
     * @returns 
     */
    __describe() {
        // TODO: move to a different private function
        if (this.node.termType === 'NamedNode') {

            return this.__formatDescribe()

        } else {

            // otherwise it is a blank node that can be either an 
            // 1. intersection
            // 2. union
            // 3. restriction 
            var intersection = this.__og.storeAny(this.node, OWL('intersectionOf'), undefined)
            var union = this.__og.storeAny(this.node, OWL('unionOf'), undefined)
            var restriction = this.__og.storeMatch(this.node, RDF('type'), OWL('Restriction'))

            const operatorsDict = SYMBOLS_DICT[this.__og.__formatter.format][this.__og.__formatter.syntax]

            if (intersection) {
                let elementsDescribed = intersection.elements.map((n) => this.__og.entityFactory(n).__describe())
                return elementsDescribed.join(` ${operatorsDict['intersection']} `)

            } else if (union) {
                let elementsDescribed = union.elements.map((n) => this.__og.entityFactory(n).__describe())
                return elementsDescribed.join(` ${operatorsDict['union']} `)

            } else if (restriction.length > 0) {

                var someValues = this.__og.storeAny(this.node, OWL('someValuesFrom'), undefined)
                var allValues = this.__og.storeAny(this.node, OWL('allValuesFrom'), undefined)


                // const someValuesEntity = new Entity(someValues, this.__store)
                // const allValuesEntity = new Entity(allValues, this.__store)

                let valuesNode = null
                let operator = null

                if (someValues) {
                    valuesNode = someValues
                    operator = operatorsDict['exists']
                    // return `${EXISTS}${onPropertyEntity.__describe()}.${someValuesEntity.__describe()}`
                } else if (allValues) {
                    // return `${FORALL}${onPropertyEntity.__describe()}.${allValuesEntity.__describe()}`
                    valuesNode = allValues
                    operator = operatorsDict['forall']
                } else
                    throw new Error('Neither existential nor universal restriction')


                let valuesNodeEntity = this.__og.entityFactory(valuesNode)

                let onProperty = this.__og.storeAny(this.node, OWL('onProperty'), undefined)
                let onPropertyEntity = this.__og.entityFactory(onProperty)

                // console.log(this.__formatter)

                if (this.__og.__formatter.syntax == 'dl')
                    return `(${operator}${onPropertyEntity.__describe()}.${valuesNodeEntity.__describe()})`
                else if (this.__og.__formatter.syntax == 'manchester')
                    return `(${onPropertyEntity.__describe()} ${operator} ${valuesNodeEntity.__describe()})`
                else
                    throw new Error('Syntax has to be either dl or manchester')

            } else {
                throw new Error('Neither union, intersection, nor restriction')
            }
        }

    }
}

class Class extends Entity {
    subClassOf() {
        return this.__describeProperties(OWL('subClassOf'))
    }

    
    equivalentClass(lhs = false) {
        const rhs = this.__describeProperties(OWL('equivalentClass'))
        if (!rhs) 
            return undefined // guard
        
        if (lhs) {
            const operator = SYMBOLS_DICT[this.__og.__formatter.format][this.__og.__formatter.syntax]['equivalent']
            return `${this.__describe()} ${operator} ${rhs}`
        } else
            return rhs
    }
}

class ObjectProperty extends Entity {
    subPropertyOf() {
        return this.__describeProperties(RDFS('subPropertyOf'))
    }
    domain() {
        return this.__describeProperties(RDFS('domain'))
    }
    range() {
        return this.__describeProperties(RDFS('range'))
    }
}

class Rule {
    constructor(entity1, relation, entity2) {
        throw new Error('Not Implemented "Rule"')
    }

}


class OntoGlimpse {
    constructor(rdfStore, formatter = new Formatter()) {
        this.__store = rdfStore
        this.__formatter = formatter
    }

    // related classes
    entityFactory(node) {
        // var x = this.storeMatch(node, RDF('type'), OWL('Class'))
        if (this.storeMatch(node, RDF('type'), OWL('Class')).length > 0)
            return new Class(node, this)
        else if (this.storeMatch(node, RDF('type'), OWL('ObjectProperty')).length > 0)
            return new ObjectProperty(node, this)
        else
            // throw new Error('Neither Class nor ObjectProperty')
            return new Entity(node, this)

    }



    // access to store only through these methods
    storeEach(s, p, o) {
        return this.__store.each(s, p, o)
    }

    storeMatch(s, p, o) {
        return this.__store.match(s, p, o)
    }

    storeAny(s, p, o) {
        return this.__store.any(s, p, o)
    }




    //
    classes() {
        return this.storeEach(undefined, RDF('type'), OWL('Class')).filter((c) => c.termType == 'NamedNode').map((c) => this.entityFactory(c))
    }

    objectProperties() {
        // return this.__store.each(undefined, RDF('type'), OWL('ObjectProperty')).map((c) => EntityFactory.create(c, this.__store))
        return this.storeEach(undefined, RDF('type'), OWL('ObjectProperty')).map((c) => this.entityFactory(c))
    }

}

export { OntoGlimpse }


