import { SYMBOLS_DICT } from './symbols.js'
import { Formatter } from './formatter.js'
import { OWL, RDF, RDFS, DCT, SCHEMA, ONTOGS } from './namespaces.js'

// current TODOS:
//--------------------------
// 1. refactor: use some nice design pattern
// 2. allow for language labels - add to formatter or somewhere a language property and try to choose that one
// 3. allow to use multiple (arrays) of properties so that a name is taken either from FOAF('name') as well as SCHEMA('name') etc
//      should I use SPARQL here? e.g.
//        { :book1 dc:title|rdfs:label ?displayString }
// 4. add unit tests
// 5. add nice documentation and examples
//  a) table with format / syntax
//  b) example with LateX - printing full ontology
//  c) example with Vue - how can be used to embed in a website using some Front-end framework e.g. Vue
// 6. implement function to read lists (node.termType = 'Collection', then node.elements is an array)
// 7. make sense of the disjointness axioms
// 8. read and extract general rules
// create a list of supported relations and prefixes etc
// convert property paths into regular expressions ?


class Entity {
    // do not use the constructor, but rather the OntologyGraph.EntityFactory
    constructor(node, __og) {
        this.node = node
        this.__og = __og

        this.iri = this.node?.value

        if (this.iri) {
            let tmpName = this.node.value.split('#').slice(-1)[0]
            let label = this.__og.storeAny(this.node, RDFS('label'), undefined)
            let name = (label && this.__og.__formatter.useLabel) ? label : tmpName

            this.name = name
        }
    }

    __describeProperties(subject, property, object) {
        const props = this.__og.storeEach(subject, property, object)

        return props.map((p) => this.__og.entityFactory(p).__describe())
        // if (props.length > 0) {
        //     return this.__og.entityFactory(equiv).__describe()
        // } else
        //     return undefined
    }



    __dataProperty(subject, property, object) {

        const annotation = this.__og.storeAny(subject, property, object)
        if (annotation)
            return annotation.value
        else
            return undefined
    }


    dataProperty(property, object) {
        return this.__dataProperty(this.node, property, object)
    }

    booleanProperty(property, object) {
        return dataProperty(property, object) === '1' ? true : false
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

    comment() {
        return this.__dataProperty(this.node, RDFS('comment'), undefined)
    }
}

class Class extends Entity {
    rangeOf() {
        return this.__describeProperties(undefined, RDFS('range'), this.node)
    }

    domainOf() {
        return this.__describeProperties(undefined, RDFS('domain'), this.node)
    }

    superClassOf() {
        return this.__describeProperties(undefined, RDFS('subClassOf'), this.node)

    }

    subClassOf(lhs = false) {
        // debugger

        const rhs = this.__describeProperties(this.node, RDFS('subClassOf'), undefined)
        if (rhs.length == 0)
            return [] // guard

        if (lhs) {
            const operator = SYMBOLS_DICT[this.__og.__formatter.format][this.__og.__formatter.syntax]['subclass']
            return `${this.__describe()} ${operator} ${rhs}`
        } else
            return rhs

    }


    equivalentClass(lhs = false) {
        // debugger

        const rhs = this.__describeProperties(this.node, OWL('equivalentClass'), undefined)
        if (rhs.length == 0)
            return [] // guard

        if (lhs) {
            const operator = SYMBOLS_DICT[this.__og.__formatter.format][this.__og.__formatter.syntax]['equivalent']
            return `${this.__describe()} ${operator} ${rhs}`
        } else
            return rhs
    }
}

class ObjectProperty extends Entity {
    subPropertyOf() {
        return this.__describeProperties(this.node, RDFS('subPropertyOf'), undefined)
    }
    superPropertyOf() {
        return this.__describeProperties(undefined, RDFS('subPropertyOf'), this.node)
    }
    domain() {
        return this.__describeProperties(this.node, RDFS('domain'), undefined)
    }
    range() {
        return this.__describeProperties(this.node, RDFS('range'), undefined)
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


    metadata() {
        let on = this.storeAny(undefined, RDF('type'), OWL('Ontology'))
        let oe = this.entityFactory(on)
        
        // TODO: refactoring necessary

        return ({
            abstract: oe.dataProperty(DCT('abstract'), undefined),
            citation: oe.dataProperty(SCHEMA('citation'), undefined),
            creationDate: oe.dataProperty(DCT('created'), undefined),
            description: oe.dataProperty(DCT('description'), undefined),
            funder: oe.dataProperty(SCHEMA('funder'), undefined),
            funding: oe.dataProperty(SCHEMA('funding'), undefined),
            // license: oe.dataProperty(SCHEMA('license'), undefined),
            name: oe.dataProperty(RDFS('label'), undefined),
            modificationDate: oe.dataProperty(SCHEMA('dateModified'), undefined),
            title: oe.dataProperty(DCT('title'), undefined),
            creators: this.personsInfo(on, DCT('creator')),
            contributors: this.personsInfo(on, DCT('contributor')),
            customSwitch1: oe.booleanProperty(ONTOGS('customSwitch1'), undefined)
            // title: oe.dataProperty(DCT('title'), undefined)
        })
    }


    __affiliationInfo(personNode) {

        let affiliationNode = this.storeAny(personNode, SCHEMA('affiliation'), undefined)
        if (!affiliationNode)
            return undefined

        let affiliation = {
            name: undefined,
            url: undefined
        }

        if (typeof affiliationNode === 'object') {
            // TODO: wrong, check if this its node.termType is Literal or a BlankNode
            // TODO: then language can be taken from node.language ('de' for German, 'en' for English) 
            let oe = this.entityFactory(affiliationNode)
            affiliation.name = oe.dataProperty(SCHEMA('name'), undefined)
            affiliation.url = oe.dataProperty(SCHEMA('url'), undefined)
        } else {
            affiliation = affiliationNode.value
        }

        return affiliation

    }

    __personInfo(node) {

        let person = {
            name: undefined,
            url: undefined,
            affiliation: undefined,

        }

        if (typeof node === 'object') {
            // then it is a blank node, possibly with name, url and affilition
            let oe = this.entityFactory(node)
            person.name = oe.dataProperty(SCHEMA('name'), undefined)
            person.url = oe.dataProperty(SCHEMA('url'), undefined)
            person.affiliation = this.__affiliationInfo(node)
        } else {
            // otherwise it is just a string
            person.name = node.value
        }

        return person

    }

    personsInfo(node, property) {
        let nodes = this.storeEach(node, property, undefined)

        return nodes.map((n) => this.__personInfo(n))


        // 'BlankNode'

        // return 5
        // return nodes.map((p) => 
        //     // it is either a blank node or a data property
        // ({}))
    }

}

export { OntoGlimpse }


