var x="PREFIX skos: <http://www.w3.org/2004/02/skos/core#>SELECT DISTINCT *WHERE {<http://id.loc.gov/authorities/subjects/sh85149842> skos:prefLabel ?prefLabel ;skos:broader ?broaderId1 .   ?broaderId1 skos:prefLabel ?broader1OPTIONAL {    ?broaderId1 skos:broader ?broaderId2 .    ?broaderId2 skos:prefLabel ?broader2 .     OPTIONAL {          ?broaderId2 skos:broader ?broaderId3 .    	?broaderId3 skos:prefLabel ?broader3 .       OPTIONAL {       ?broaderId3 skos:broader ?broaderId4 .    	?broaderId4 skos:prefLabel ?broader4 .           OPTIONAL {       ?broaderId4 skos:broader ?broaderId5 .    	?broaderId5 skos:prefLabel ?broader5 .         OPTIONAL {          ?broaderId5 skos:broader ?broaderId6 .    	?broaderId6 skos:prefLabel ?broader6 .               OPTIONAL {          ?broaderId6 skos:broader ?broaderId7 .    	?broaderId7 skos:prefLabel ?broader7 .                 OPTIONAL {          ?broaderId7 skos:broader ?broaderId8 .    	?broaderId8 skos:prefLabel ?broader8 .              }            }        }        }         }    }   }  }ORDER BY ASC(?broaderId1)LIMIT 1000
