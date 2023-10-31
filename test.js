import * as path from 'path'
import * as $rdf from 'rdflib'
import * as fs from 'fs'


import { OntoGlimpse } from 'ontoglimpse'

// import * as oga from 'ontoglimpse.js'


const ONTOLOGY_FILE_NAME = '/home/piotr/Dresden/kimeds/own_ontology_documentation/js/kimeds-ontology.owl'




const encoding = 'utf-8' 
const mime = 'text/turtle' 
const base_uri = 'http://example.com/ontology#'

const store = $rdf.graph()

const ontologyData = fs.readFileSync(ONTOLOGY_FILE_NAME, encoding)
$rdf.parse(ontologyData, store, base_uri, mime)

const og = new OntoGlimpse(store)

// const ops = og.objectProperties()
og.classes().map((c) => c.equivalentClass())

console.log('debug')