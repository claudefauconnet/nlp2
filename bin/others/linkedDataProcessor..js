var async = require('async')
var httpProxy = require('../httpProxy.')
var fs = require('fs')


var rdfsMap = {

    //   'BNF':{sparql_url:'https://data.bnf.fr/sparql',graphIRI:'http://data.bnf.fr',sparqlBuilder:"sparql_skos_generic"},
    //  'Dbpedia':{sparql_url:'http://dbpedia.org/sparql',graphIRI:'http://dbpedia.org',sparqlBuilder:"sparql_skos_generic"},

    //   'LibraryOfCongress':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://www.loc.gov/',sparqlBuilder:"sparql_skos_generic"},
    //   'Oil&Gas-Upstream':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://souslesens.org/oil-gas/upstream/',sparqlBuilder:"sparql_skos_generic"},
    //   'TermSciences':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://api.termsciences.fr/termsciences/',sparqlBuilder:"sparql_skos_generic"},
    //   'ThesaurusIngenieur':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://www.souslesens.org/thesaurusIngenieur/',sparqlBuilder:"sparql_skos_generic"},
    //  'Total-CTG':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://thesaurus.ctg.total.com/',sparqlBuilder:"sparql_skos_generic"},
    //   'Unesco':{sparql_url:'http://vps475829.ovh.net:8890/sparql',graphIRI:'http://skos.um.es/unesco6/',sparqlBuilder:"sparql_skos_generic"},

    'Wikidata': {sparql_url: 'https://query.wikidata.org/', graphIRI: 'http://skos.um.es/unesco6/', sparqlBuilder: "sparql_Wikidata"},


}
var ctgWords = ['Corrosion',
    'Meteorological Phenomenon',
    'Fatigue',
    'Displacement',
    'Environmental',
    'Reaction',
    'Absorption',
    'Ageing',
    'Initiation Phenomenon',
    'Explosion',
    'Vibration Phenomenon',
    'Abnormal Displacement',
    'Brittle Fracture',
    'Clogging',
    'Crack Propagation',
    'Cracking',
    'Dust Accumulation',
    'Dust Emission',
    'Fugitive Emission',
    'Poisonning',
    'Water Accumulation',
    'Anodizing',
    'Contamination',
    'Decontamination',
    'Dephosphorization',
    'Dimerization',
    'Fermentation',
    'Fire',
    'Neutralization',
    'Polarization',
    'Polymerisation',
    'Product Deposition',
    'Radioactivity',
    'Arc Flash',
    'Conduction',
    'Earth Fault',
    'Earth Leakage',
    'Electric Arc',
    'Electrical Discharge',
    'Electrical Discharge Machining',
    'Electrical Heat',
    'Electrical Runout',
    'Frequency Variation',
    'Harmonic Distortion',
    'Lightning',
    'Overvoltage',
    'Shedding',
    'Short Circuit',
    'Static Electricity Discharge',
    'Voltage Cyclic Variation',
    'Voltage Drop',
    'Electromagnetic Compatibility',
    'Electromagnetic Disturbance',
    'Electromagnetic Induction',
    'Electromagnetic Interference',
    'Electromagnetic Radiation',
    'Bending',
    'Floatation',
    'Friction',
    'Mechanical Runout',
    'Evaporation',
    'Gelation',
    'Liquefaction',
    'Phase Shift',
    'Solidification',
    'Sublimation',
    'Vaporization',
    'Abrasion',
    'Adsorption',
    'Equipment Overflow',
    'Fan Stall',
    'Fluidization',
    'Foaming',
    'Gas Emission',
    'Gravity',
    'Molding',
    'Noise Emmision',
    'Nucleate Boiling',
    'Pressure Variation',
    'Product Overflow',
    'Radiation',
    'Refraction',
    'Sorption',
    'Sticking',
    'Surge',
    'Vibration',
    'Adhesion',
    'Atomization',
    'Crystallization',
    'Dissolution',
    'Floculation',
    'Hydrolysis',
    'Oxidation Reaction',
    'Precipitation',
    'Stabilised burning',
    'Vitrification',
    'Combustion',
    'Convection',
    'Cooling',
    'Dilatation',
    'Freezing',
    'Heat Conduction',
    'Heating',
    'Temperature Variation',
    'Thermal Aging',
    'Thermal Expansion',
    'Thermal Growth',
    'Thermal Radiation',
    'Thermal Shock',
    'Thermal Stress',
    'With Metal Loss',
    'Without Metal Loss',
    'Movement Of The Sea',
    'Air Fog',
    'Fatigue Cracking',
    'Storm',
    'Acceleration',
    'Bacterial Growth',
    'Carburization',
    'CO2 Absorption',
    'Coating Ageing',
    'Condensation',
    'Crack Initiation',
    'Creep',
    'Decarburization',
    'Deceleration',
    'Deflagration',
    'Deflagration To Detonation Transition',
    'Desublimation',
    'Detonation',
    'Dissimilar Weld Cracking',
    'Earthquake',
    'Energy Absorption',
    'Fatigue Corrosion',
    'Flooding',
    'Freezing (Weather)',
    'Frost',
    'Graphitization',
    'Hail',
    'Humid Ageing',
    'Hurricane',
    'Hydrogen Embrittlement',
    'Lateral Buckling',
    'Light Absorption',
    'Marine Growth',
    'No Sun / Black Day',
    'Overheating',
    'Oxidizing',
    'Oxydation',
    'Partial Oxydation',
    'Pit Initiation',
    'Pyrolysis',
    'Rain',
    'Reheat Cracking',
    'Rotation',
    'Sigma Phase Embrittlement',
    'Snow',
    'Steam Blanketing',
    'Strain Aging',
    'Sunshine',
    'Temper Embrittlement',
    'Temperature Embrittlement',
    'Tornado',
    'Upheaval Buckling',
    'Vortex Induced Vibration',
    'Water Absorption',
    'Wind',
    'Alkaline Sour Water Corrosion',
    'Amine Chloride Corrosion',
    'Amine Corrosion',
    'Amine Cracking',
    'Ammonium Bisulfide Corrosion',
    'Ammonium Chloride Corrosion',
    'Atmospheric Corrosion',
    'Blistering',
    'Bottom-Line Corrosion',
    'Carbonate Stress Corrosion Cracking',
    'Carboxylic Acid Corrosion',
    'Caustic Corrosion',
    'Caustic Cracking',
    'Cavitation',
    'Chloride Stress Corrosion Cracking',
    'CO2 Corrosion',
    'Corrosion by Oxygen',
    'Corrosion by Sulfur',
    'Corrosion Under Insulation',
    'Crevice Corrosion',
    'Erosion',
    'Erosion-Corrosion',
    'Ethanol Stress Corrosion Cracking',
    'Flow Enhanced Corrosion',
    'Flue Gas Dew Point Corrosion',
    'Frosted',
    'Fuel Ash Corrosion',
    'Galvanic Corrosion',
    'Galvanically Induced Hydrogen Stress Cracking',
    'H2S + CO2 Corrosion',
    'HF-Stress Corrosion Cracking',
    'High Temperature H2/H2S Corrosion',
    'High Temperature Hydrogen Attack',
    'High Temperature Oxydation',
    'Hydrochloric Acid Corrosion',
    'Hydrofluoric Acid Corrosion',
    'Hydrogen Sulfide Cracking',
    'Ice',
    'Lean Amine Corrosion',
    'Liquid Erosion-Corrosion',
    'Liquid Metal Embrittlement',
    'Mechanical Fatigue',
    'Methanol Stress Corrosion Cracking',
    'Microbial Induced Corrosion',
    'Naphtenic Acid Corrosion',
    'Nitriding',
    'Organic Acid Corrosion',
    'Pitting Corrosion',
    'Polythionic Acid Stress Corrosion Cracking',
    'Preferential Weld Corrosion',
    'Sand Storm',
    'Solid Erosion-Corrosion',
    'Stress Corrosion Cracking',
    'Sulfidation',
    'Sulfuric Acid Corrosion',
    'Swell',
    'Thermal Fatigue',
    'Thunderstorm',
    'Tide',
    'Titanium Hydriding',
    'Top Of Line Corrosion',
    'Tsunami',
    'Under Deposit Corrosion',
    'Wave',
    'Mechanical erosion',
    'Hydrogen Induced Cracking',
    'Stress Oriented Hydrogen Induced Cracking',
    'Sulfide Stress Cracking',
    'Sour Top Of Line Corrosion',
    'Sweet Top Of Line Corrosion',


    'Animal Organism',
    'Animals',
    'Bacteria',
    'Fauna',
    'Flora',
    'Human',
    'Marine Dirt',
    'Microorganism',
    'Plant Organism',
    'Chemical Compound',
    'Composite',
    'Fluid',
    'Hydrocarbon',
    'Metallic',
    'Mineral',
    'Natural',
    'Polymer',
    'Solid Material',
    'Activated Sludge',
    'Air',
    'Condensate',
    'Deposit',
    'Drying Agent',
    'Dye',
    'Enzyme',
    'Fabric',
    'Firefighting Product',
    'Food',
    'Functional Fluid',
    'Functional Material',
    'Ion-Exchange Resin',
    'Mixture',
    'Nutrient',
    'Pigment',
    'Technical Chemical',
    'Waste',
    'Electron',
    'Ion',
    'Isotope',
    'Molecule',
    'Neutron',
    'Proton',
    'Anaerobic Bacteria',
    'Legionella',
    'Planktonic Bacteria',
    'Sessile Bacteria',
    'Acid',
    'Alcohol',
    'Amine',
    'Base',
    'Carbamide',
    'Dimethyl Fumarate',
    'Glutaraldehyde',
    'Hydrazine',
    'Monomer',
    'Oxide',
    'Salt',
    'Sulfur',
    'Synthetic Fibre',
    'Ceramic',
    'Concrete',
    'Epoxy',
    'Glass',
    'Glue',
    'Graphite',
    'Quartz',
    'Tantalum',
    'Vinylester',
    'Closed Drain Product',
    'Gas',
    'Oil',
    'Water',
    'Aliphatic Hydrocarbon',
    'Alkylate',
    'Aromatic Hydrocarbon',
    'Conventional Heavy',
    'Distillate',
    'Liquefied Hydrocarbon',
    'Liquid Hydrocarbon',
    'Mineral Oil',
    'Naphtha',
    'Solid Hydrocarbon',
    'Synthetic Fuel',
    'Metal Alloy',
    'Metal Element',
    'Precious Metal',
    'Greigite',
    'Mackinawite',
    'Pyrite',
    'Molasses',
    'Protein',
    'Wood',
    'Copolymer',
    'Elastomer',
    'Plastic',
    'Polyalphaolefin',
    'Polyetheretherketone',
    'Polyolefin',
    'Polytetrafluoroethylene',
    'Polyurethane',
    'Silicone',
    'Synthetic Resin',
    'Thermosetting Plastic',
    'Brick',
    'Carbon Black',
    'Cement',
    'Clay',
    'Coal',
    'Coke',
    'Dust',
    'Fine Particles',
    'Ground',
    'Heat-Conducting Cement',
    'Plaster',
    'Rock',
    'Sand',
    'Silica',
    'Solid Particle',
    'Tile',
    'Zirconium Oxide',
    'Dry Air',
    'Instrument Air',
    'Process Air',
    'Service Air',
    'Steam Condensate',
    'Scale',
    'Sediment',
    'Fluorescein',
    'Fire Water',
    'Foam Solution Water',
    'Halon Gas',
    'Base Oil',
    'Compressed Gas',
    'Dielectric Fluid',
    'Drilling Fluid',
    'Fill Fluid',
    'Flotation Oil',
    'Fluxant',
    'Fracturing Fluid',
    'Fuel',
    'Heat Transfer Fluid',
    'Leak Detection Fluid',
    'Oil Product',
    'Packer Fluid',
    'Penetrant',
    'Reservoir Fluid',
    'Spacer Fluid',
    'Water Base Fluid',
    'Well Completion Fluid',
    'Well Control Fluid',
    'Workover Fluid',
    'Combustible',
    'Contruction Material',
    'Corrosion Resistant Alloy',
    'Explosive',
    'Fireproofing Material',
    'Graphite Filler',
    'Hazardous Material',
    'Insulating Material',
    'Interstitial Material',
    'Raw Material',
    'Reflector',
    'Refractory Material',
    'Self-Healing Material',
    'Walnut Shell',
    'Colloidal Dispersion',
    'Emulsion',
    'Foam',
    'Gel Coat',
    'Slurry',
    'Abrasive',
    'Additive',
    'Adhesive',
    'Biocide',
    'Carrier Product',
    'Catalyst',
    'Coagulant',
    'Lubricant',
    'Microsphere',
    'Molecular Sieve',
    'Oxidizer',
    'Oxidizing Acid',
    'Preservative',
    'Reductant',
    'Solvent',
    'Sorbant',
    'Ash',
    'Basic Sediment & Water',
    'Exhaust Gas',
    'Filter Cake',
    'Residue',
    'Slag',
    'Sludge',
    'Solid Waste',
    'Spent Acid',
    'Tailings',
    'Waste Gas',
    'Waste Oil',
    'Waste Water',
    'Anion',
    'Cation',
    'Sulfur Reducing Bacteria',
    'Carboxylic Acid',
    'Mineral Acid',
    'Noncarboxylic Acid',
    'Organic Acid',
    'Polythionic Acid',
    'Ethanol',
    'Glycol',
    'Methanol',
    'Phenol',
    'Propanol',
    'Lean Amine',
    'Primary Amine',
    'Rich Amine',
    'Secondary Amine',
    'Tertiary Amine',
    'Volatile Amine',
    'Alkaline',
    'Ammonia',
    'Hydroxide',
    'Caprolactam',
    'Carbon Dioxide',
    'Nitrogen Dioxide',
    'Nitrogen Oxide',
    'Sulfur Dioxide',
    'Sulfur Monoxide',
    'Sulfur Oxide',
    'Sulfur Trioxide',
    'Acetate',
    'Ammonium',
    'Bicarbonate',
    'Carbamate',
    'Carbide',
    'Carbonate',
    'Cyanide',
    'Halide',
    'Heat Stable Salt',
    'Hypochlorite',
    'Molten Salt',
    'Naphthenate',
    'Nitrate',
    'Nitride',
    'Phosphate',
    'Silicate',
    'Sulfate',
    'Sulfide',
    'Sulfite',
    'Vanadate',
    'Sulfur Compound',
    'Sulfur Hexafluoride',
    'Aramid',
    'Mineral Wool',
    'Polyamide',
    'Refractory Bricks',
    'Refractory Concrete',
    'Fusion Bonded Epoxy',
    'Glass Fiber Reinforced Epoxy',
    'Glass Flake Epoxy',
    'Phenolic Epoxy',
    'Amine Drain',
    'Cold Drain',
    'Disulfide Drain',
    'Glycol Drain',
    'Methanol Drain',
    'Sour Water Drain',
    'Acid Gas',
    'Combustion Gas',
    'Flue Gas',
    'Gas Element',
    'Inert Gas',
    'Instrument Gas',
    'Manufactured Gas',
    'Mercaptan',
    'Natural Gas',
    'Process Gas',
    'Produced Gas',
    'Seal Gas',
    'Synthetic Gas',
    'Tail Gas',
    'Crude Oil',
    'Diesel Oil',
    'Disulfide Oil',
    'Heavy Cycle Oil',
    'Hot Oil',
    'Light Cycle Oil',
    'Oil Export',
    'Process Oil',
    'Produced Oil',
    'Quench Oil',
    'Seal Oil',
    'Synthetic Oil',
    'Aquifer Water',
    'Boiler Blowdown',
    'Boiler Feed Water',
    'Brackish Water',
    'Brine',
    'Condensed Water',
    'Demineralized Water',
    'Desalinated Water',
    'Distilled Water',
    'Drinking Water',
    'Effluent',
    'Fog',
    'Formation Water',
    'Free Water',
    'Fresh Caustic Water',
    'Fresh Water',
    'Hot Water',
    'Oily Water',
    'Plasma',
    'Rain Water',
    'Reagent',
    'Sea Water',
    'Sour Water',
    'Spent Caustic Water',
    'Steam',
    'Stripped Water',
    'Utility Water',
    'Well Water',
    'Acetylene',
    'Alkane',
    'Alkene',
    'Ethane',
    'Paraffin',
    'Benzene',
    'Naphthalene',
    'Pyrolysis Gasoline',
    'Styrene',
    'Xylene',
    'Heavy Distillate',
    'Light Distillate',
    'Kerosene',
    'Heavy Naphtha',
    'Light Naphtha',
    'Asphaltene',
    'Bitumen',
    'Wax',
    'Cyclohexane',
    'Aluminium Alloy',
    'Babbitt',
    'Copper Alloy',
    'Nickel Alloy',
    'Steel',
    'Titanium Alloy',
    'Alkaline Earth Metal',
    'Aluminium',
    'Cadmium',
    'Chromium',
    'Copper',
    'Iron',
    'Lead',
    'Mercury',
    'Metalloid',
    'Molybdenum',
    'Nickel',
    'Titanium',
    'Tungsten',
    'Zinc',
    'Zirconium',
    'Acrylic Polyurethane',
    'Butadiene Rubber',
    'Chloroprene Rubber',
    'Chlorosulfonated Polyethylene',
    'Ebonite',
    'Ethylene Propylene Diene Monomer',
    'Fluoroelastomer',
    'Isoprene Rubber',
    'Natural Rubber',
    'Nitrile Rubber',
    'Perfluoroelastomer',
    'Rubber',
    'Styrene Butadiene Rubber',
    'Synthetic Rubber',
    'Glass Reinforced Plastic',
    'Thermoplastic',
    'Cold Steam Condensate',
    'HP Steam Condensate',
    'LP Steam Condensate',
    'MP Steam Condensate',
    'Polluted Steam Condensate',
    'Drill In Fluid',
    'Non Aqueous Based Mud',
    'Oil Base Mud',
    'Polymer Mud',
    'Synthetic Base Mud',
    'Water Base Mud',
    'Fossil Fuel',
    'Fuel Gas',
    'Fuel Oil',
    'Liquid Fuel',
    'Coolant',
    'Heating Fluid',
    'Backfill',
    'Ballast',
    'Latex',
    'Oil In Water Emulsion',
    'Water In Oil Emulsion',
    'Cemment Slurry',
    'FCCU Slurry',
    'Antifoaming Agent',
    'Antifouling Agent',
    'Antioxidant Additive',
    'Antistatic Agent',
    'Bacteriostat',
    'Cement Additive',
    'Complexing Agent',
    'Deodorant',
    'Depressant',
    'Expanded Perlite',
    'Foaming Agent',
    'Inhibitor',
    'Neutralizer',
    'Ph Stabilizer',
    'Plugging Agent',
    'Promoter',
    'Retarder',
    'Sacrificial Agent',
    'Scavanger',
    'Surface Active Agent',
    'Thickener',
    'Wetting Agent',
    'Bactericide',
    'THPS Biocide',
    'Catalyst Fines',
    'Grease',
    'Hydraulic Fluid',
    'Lube Oil',
    'Chlorinated Solvent',
    'Furfural',
    'Hydrocarbon Solvent',
    'N-Methylpyrrolidone',
    'Sulfolane',
    'Trichlorethylene',
    'Absorbent',
    'Adsorbant',
    'Atmospheric Residue',
    'Pigwax',
    'Vacuum Residue',
    'Visbroken Vacuum Residue',
    'Acrylic Acid',
    'Citric Acid',
    'Ethylenediaminetetraacetic Acid',
    'Fatty Acid',
    'Formic Acid',
    'Lactic Acid',
    'Oxalic Acid',
    'Propionic Acid',
    'Thioglycolic Acid',
    'Hydrobromic Acid',
    'Hydrochloric Acid',
    'Nitric Acid',
    'Sulfuric Acid',
    'Hydrofluoric Acid',
    'Hydrogen Cyanide',
    'Phosphoric Acid',
    'Silicic Acid',
    'Carbonic Acid',
    'Naphthenic Acid',
    'Nucleic Acid',
    'Diethylene Glycol',
    'Ethylene Glycol',
    'Monoetylene Glycol',
    'PolyalkyIeneglycol',
    'Triethylene Glycol',
    'Diglycolamine',
    'Monoethanolamine',
    'Diethanolamine',
    'Diisopropanolamine',
    'Morpholine',
    'Methyldiethanolamine',
    'Triethanolamine',
    'Aluminium Hydroxide',
    'Calcium Hydroxide',
    'Potassium Hydroxide',
    'Sodium Hydroxide',
    'Chromium Carbide',
    'Silicon Carbide',
    'Tungsten Carbide',
    'Calcium Carbonate',
    'Iron Carbonate',
    'Potassium Carbonate',
    'Sodium Bicarbonate',
    'Sodium Carbonate',
    'Ferricyanide',
    'Potassium Ferricyanide',
    'Chloride',
    'Fluoride',
    'Sodium Hypochlorite',
    'Silicon Nitride',
    'Barium Sulfate',
    'Copper Sulfate',
    'Tetrakis Hydroxymethyl Phosphonium Sulfate',
    'Thiosulfate',
    'Ammonium Bisulfide',
    'Carbonyl Sulfide',
    'Chromium Sulfide',
    'Hydrogen Sulfide',
    'Hydrosulfide',
    'Iron Sulfide',
    'Polyphenylene Sulfide',
    'Sodium Vanadate',
    'Chlorine Gas',
    'Dihydrogen',
    'Fluorine',
    'Hydrogen',
    'Nitrogen',
    'Oxygen',
    'Associated Gas',
    'Dry Gas',
    'Liquefied Natural Gas',
    'Sour Gas',
    'Sweet Gas',
    'Wet Gas',
    'Brine Reject',
    'Chloride Brine',
    'High Pressure Steam',
    'Low Pressure Steam',
    'Medium Pressure Steam',
    'Saturated Steam',
    'Stripping Steam',
    'Superheated Steam',
    'Butane',
    'Methane',
    'Pentane',
    'Propane',
    'Butadiene',
    'Butene',
    'Ethylene',
    'Propylene',
    'Series 3000',
    'Series 5000',
    'Series 6000',
    'Aluminium Bronze',
    'Brass',
    'Bronze',
    'Copper Nickel',
    'Nickel Aluminium Bronze',
    'Incoloy',
    'Ni-Cr-Mo Alloy',
    'Ni-Cu Alloy',
    'Nickel Chrome',
    'Carbon Steel',
    'Clad Product',
    'Cr-Mo Steel',
    'Galvanized Steel',
    'Glass Lined Steel',
    'Heat Resistant Steel',
    'Low Alloy Steel',
    'Refractory Steel',
    'Stainless Steel',
    'Tool Steel',
    'Barium',
    'Calcium',
    'Magnesium',
    'Iron Ion',
    'Antimony',
    'Arsenic',
    'Boron',
    'Silicon',
    'Acrylonitrile Butadiene Styrene',
    'Chlorinated Polyvinyl Chloride',
    'Ethylene Chlorotrifluoroethylene',
    'High Density Polyethylene',
    'Linear Low Density Polyethylene',
    'Low Density Polyethylene',
    'Medium Density Polyethylene',
    'Perfluoroalkoxy Alkane',
    'Perfluoroether',
    'Polyethylene',
    'Polypropylene',
    'Polyvinyl Chloride',
    'Reinforced Thermoplastic Polyethylene',
    'Fresh Water Mud',
    'Diesel Fuel',
    'Gasoline',
    'Liquefied Petroleum Gas',
    'Cooling Water',
    'Dry Ice',
    'Freon',
    'Mixte Refrigerant',
    'Propane Refrigerant',
    'Refrigerant',
    'Antifreeze',
    'Emulsifier',
    'Pour Point Depressant',
    'Acid Inhibitor',
    'Corrosion Inhibitor',
    'Hydrate Inhibitor',
    'Paraffin Inhibitor',
    'Scale Inhibitor',
    'Vapour Phase Inhibitor',
    'Volatile Inhibitor',
    'Wax Inhibitor',
    'Oxygen Scavenger',
    'Cosurfactant',
    'Demulsifier',
    'Detergent',
    'Reverse Demulsifier',
    'Silica Gel',

]
var linkedDataProcessor = {
    processCTG: function () {
        var lindedDataArray = [];
        var sources = []
        for (var key in rdfsMap) {
            rdfsMap[key].name = key;

            sources.push(rdfsMap[key])

        }


        async.series([

            // load CTG terms
            function (callbackSeries) {
                return callbackSeries();

            },

            // query ontologies
            function (callbackSeries) {


                async.eachSeries(sources, function (source, callbackEachSource) {
                    var wordIndex = 0
                    console.log(source.name + " beginning" + lindedDataArray.length);
                    //   ctgWords=ctgWords.slice(0,5)
                    async.eachSeries(ctgWords, function (word, callbackEachWord) {
                        wordIndex += 1
                        if (wordIndex % 10 == 0)
                            console.log("words" + wordIndex)
                        var url2 = "";
                        var query = ""
                        if (source.name = "Wikidata") {
                            url2 = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" + word + "&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*"
                        } else {
                            var url = source.sparql_url + "?default-graph-uri=" + encodeURIComponent(source.graphIRI) + "&query=";// + query + queryOptions
                            query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#> " +
                                " " +
                                "SELECT DISTINCT * WHERE { " +
                                "?id skos:prefLabel ?prefLabel . " +
                                " FILTER(lcase(str(?prefLabel)) = '" + word.toLowerCase() + "')  " +
                                " FILTER (lang(?prefLabel) = 'en') " +
                                "optional { " +
                                "   ?id skos:definition ?definition. " +
                                "}  " +
                                "optional { " +
                                "   ?id skos:broader ?broader. " +
                                "   " +
                                "}  " +
                                " " +
                                "}LIMIT 1000"
                            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"


                            var query2 = encodeURIComponent(query);
                            query2 = query2.replace(/%2B/g, "+")
                            var url2 = url + query2 + queryOptions;
                        }
                        httpProxy.get(url2, function (err, result) {
                            if (err) {
                                console.log(err + " : " + source.graphIRI + "   " + query);
                                console.log(url2);
                                return callbackEachWord()
                            }


                            if (source.name == "Wikidata") {
                                if (result.search) {
                                    result.search.forEach(function (item) {
                                        lindedDataArray.push({source: source.name, labelCTG: word, linkedId: item.concepturi, linkedDefinition: item.description, broader: ""})
                                        if (lindedDataArray.length % 10 == 0)
                                            console.log(lindedDataArray.length)
                                    })
                                }
                            } else {
                                var bindings = []
                                if (result.results) {
                                    result.results.bindings.forEach(function (item) {
                                        lindedDataArray.push({source: source.name, labelCTG: word, linkedId: item.id, linkedDefinition: item.definition, broader: item.broader})
                                        if (lindedDataArray.length % 10 == 0)
                                            console.log(lindedDataArray.length)
                                    })
                                }
                            }
                            callbackEachWord();

                        })


                    }, function (err) {
                        console.log(source.name + " done" + lindedDataArray.length);
                        return callbackEachSource(err)

                    })
                }, function (err) {

                    return callbackSeries(err)
                })
            },


            function (callbackSeries) {

                return callbackSeries();

            },

            function (callbackSeries) {

                return callbackSeries();

            }


        ], function (err) {
            if (err)
                return console.log(err);

            fs.writeFileSync("D:\LP\\synthese\\linkedDataCTG.json", JSON.stringify(lindedDataArray, null, 2))


        })


    },

    toCsv: function () {
        //    var jsonArray = JSON.parse("" + fs.readFileSync("D:\LP\\synthese\\linkedDataCTG_W.json"))
      //  var jsonArray = JSON.parse("" + fs.readFileSync("D:\\NLP\\synthese\\linkedDataCTGBabelNetConceptsDefs.json"))
        var jsonArray = JSON.parse("" + fs.readFileSync("D:\\NLP\\synthese\\linkedDataCTG-wikidata.json"))


        var str = "";
        jsonArray.forEach(function (item) {
            if (item.source == "Wikidata") {
                str += item.labelCTG + "\t" + item.source + "\t" + item.linkedId + "\t" + item.description + "\t" +item.linkedLabel+ "\t" + "" + "\n";

            } else {

                var description = "";
                if (item.description)
                    description = item.description;

                str += item.labelCTG + "\t" + item.source + "\t" + item.linkedId + "\t" + description + "\t" + linkedLabel + "\t" + "" + "\n";
            }

        })


        fs.writeFileSync("D:\\NLP\\synthese\\linkedDataCTG-wikidata.csv", str)
    }

    , processCTG_babelNet: function () {
        var linkedConcepts = [];
        var allWords = [];
        var key = "a7371c22-6f58-40d0-b3ae-85ae3a33923e"

        var key = "a7371c22-6f58-40d0-b3ae-85ae3a33923e"
        async.series([
            function (callbackSeries) {
                return callbackSeries();
                async.eachSeries(ctgWords, function (word, callbackEachWord) {

                    var url = "https://babelnet.io/v5/getSynsetIds?lemma=" + word + "&searchLang=EN&POS=NOUN&key=" + key
                    httpProxy.get(url, {}, function (err, concepts) {
                        if (err)
                            return callbackEachWord(err)
                        concepts.forEach(function (concept) {
                            concept.lemma = word
                            linkedConcepts.push(concept)
                        })

                        callbackEachWord();
                    })
                }, function (err) {
                    fs.writeFileSync("D:\\NLP\\synthese\\linkedDataCTG-babelNet_concepts.json", JSON.stringify(linkedConcepts, null, 2))
                    callbackSeries(err);
                })


            },
            function (callbackSeries) {
                var lindedDataArray = [];
                var linkedConcepts = JSON.parse("" + fs.readFileSync("D:\\NLP\\synthese\\linkedDataCTGBabelNetConcepts.csv"))
                var countConcepts = 0

                /*  linkedConcepts.sort(function (a, b) {
                      if (a.id > b.id)
                          return 1;
                      if (a.id < b.id)
                          return -1;
                      return 0;
                  })*/

                async.eachSeries(linkedConcepts, function (concept, callbackEachConcept) {

                    if (concept.pos != "NOUN")
                        return callbackEachConcept()
                    var id = concept.id.substring(concept.id.indexOf(":") + 1)

                    countConcepts += 1
                    if (countConcepts % 200 == 0)
                        console.log("concepts " + countConcepts)
                    /*        var url2 = "https://babelnet.org/sparql?default-graph-uri=http://babelnet.org/rdf/&query="
                         var query = "SELECT DISTINCT *WHERE {   <http://babelnet.org/rdf/s"+id+">  bn-lemon:synsetID ?synsetID . " +
                             "    OPTIONAL {          <http://babelnet.org/rdf/s"+id+"> bn-lemon:definition ?definition .   " +
                             "       ?definition  lemon:language  'EN' .  " +
                             "        ?definition bn-lemon:gloss  ?gloss .  " +
                             "?definition dcterms:license ?license ." +
                             "          ?definition dc:source ?sourceurl . " +
                             " }" +
                             "}"

                              query = encodeURIComponent(query);
                              query = query.replace(/%20/g, "+")


                         //   query="SELECT+DISTINCT+*WHERE+%7B+++%3Chttp%3A%2F%2Fbabelnet.org%2Frdf%2F"+id+"%3E++bn-lemon%3AsynsetID+%3FsynsetID+.+++++OPTIONAL+%7B++++++++++%3Chttp%3A%2F%2Fbabelnet.org%2Frdf%2Fs00022872n%3E+bn-lemon%3Adefinition+%3Fdefinition+.++++++++++%3Fdefinition+lemon%3Alanguage+%27EN%27+.++++++++++%3Fdefinition+bn-lemon%3Agloss+%3Fgloss+.++++++++++%3Fdefinition+dcterms%3Alicense+%3Flicense+.++++++++++%3Fdefinition+dc%3Asource+%3Fsourceurl+.+++++%7D%7D"
                            var queryOptions = "&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=5000&debug=on"
                            url2 = url2 + query + queryOptions;*/
                    var url2 = "https://babelnet.org/sparql/?query=SELECT+DISTINCT+*WHERE+%7B+++%3Chttp%3A%2F%2Fbabelnet.org%2Frdf%2Fs" + id + "%3E++bn-lemon%3AsynsetID+%3FsynsetID+.+++++OPTIONAL+%7B++++++++++%3Chttp%3A%2F%2Fbabelnet.org%2Frdf%2Fs" + id + "%3E+bn-lemon%3Adefinition+%3Fdefinition+.++++++++++%3Fdefinition+lemon%3Alanguage+%27EN%27+.++++++++++%3Fdefinition+bn-lemon%3Agloss+%3Fgloss+.++++++++++%3Fdefinition+dcterms%3Alicense+%3Flicense+.++++++++++%3Fdefinition+dc%3Asource+%3Fsourceurl+.+++++%7D%7D&format=application%2Fsparql-results%2Bjson"


                    httpProxy.get(url2, {}, function (err, definitions) {
                        if (err)
                            return callbackEachConcept(err);
                        if (countConcepts > 800)
                            return callbackEachConcept();

                        if (definitions.results) {
                            definitions.results.bindings.forEach(function (item) {
                                var linkedDefinition = ""
                                if (item.gloss)
                                    linkedDefinition = item.gloss.value
                                var license = ""
                                if (item.license)
                                    license = item.license.value

                                var id = "babelnet.org/rdf/s" + item.synsetID.value.substring(item.synsetID.value.indexOf(":") + 1)
                                lindedDataArray.push({source: "BabelNet", labelCTG: concept.lemma, linkedId: id, linkedDefinition: linkedDefinition, broader: "", license: license})
                                if (lindedDataArray.length % 10 == 0)
                                    console.log(lindedDataArray.length)

                            })
                        }

                        return callbackEachConcept();


                    })
                }, function (err) {
                    return callbackSeries(err);
                })


            }


        ], function (err) {
            if (err)
                return console.log(err);
            fs.writeFileSync("D:\\NLP\\synthese\\linkedDataCTG-babelNet.json", JSON.stringify(lindedDataArray, null, 2))
        })

    },

    getCTGWikidataDescription: function () {

var lindedDataArray=[];
            async.eachSeries(ctgWords, function (word, callbackEach) {
                word= word.replace(/\s/g,"+")
                var url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=" +
                    word + "&format=json&errorformat=plaintext&language=en&uselang=en&type=item&origin=*"

                httpProxy.get(url, {}, function (err, definitions) {
                    if (err)
                        return callbackEach(err);


                    if (definitions.search) {
                        definitions.search.forEach(function (item) {


                            lindedDataArray.push({source: "Wikidata", labelCTG: word, linkedId: item.concepturi, linkedLabel:item.label,description: item.description})
                            if (lindedDataArray.length % 10 == 0)
                                console.log(lindedDataArray.length)

                        })
                    }

                    return callbackEach();


                })

            }, function (err) {
                if (err)
                    return console.log(err);
                fs.writeFileSync("D:\\NLP\\synthese\\linkedDataCTG-wikidata.json", JSON.stringify(lindedDataArray, null, 2))
            })

        }


    }


//linkedDataProcessor.processCTG();

   linkedDataProcessor.toCsv()

//linkedDataProcessor.getCTGWikidataDescription()
//linkedDataProcessor.processCTG_babelNet()
    module.exports = linkedDataProcessor;
