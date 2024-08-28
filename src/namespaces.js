import * as $rdf from 'rdflib'

// Namespaces
const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#")
const OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#")
const DCT = $rdf.Namespace('http://purl.org/dc/terms/')
const SCHEMA = $rdf.Namespace('https://schema.org/')
const ONTOGS = $rdf.Namespace('https://www.npmjs.com/package/ontoglimpse#')


export { RDF, RDFS, OWL, DCT, SCHEMA, ONTOGS }
