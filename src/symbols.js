// in DL syntax we have first an operator and then the property and then a dot i.e.
//  ∃ hasHarm.Harm
// in Manchester syntax we have first the property then the operator and then class i.e.
//  hasHarm some Harm

const SYMBOLS_DICT = {
    'latex': {
        'dl': {
            'union': '\\sqcup',
            'intersection': '\\sqcap',
            'exists': '\\exists',
            'forall': '\\forall',
            'subclass': '\\sqsubseteq',
            'equivalent': '\\equiv'
        },
        'manchester': {
            'union': '\\text{or}',
            'intersection': '\\text{and}',
            'exists': '\\text{some}', //
            'forall': '\\text{all}',  //
            'subclass': '\\text{subclassOf}',
            'equivalent': '\\text{equivalentTo}'
        },
    },
    'html': {
        'dl': { // maybe add some spans around it
            'union': '⊔',
            'intersection': '⊓',
            'exists': '∃',
            'forall': '∀',
            'subclass': '⊑',
            'equivalent': '≡'
        },
        'manchester': {
            'union': 'or',
            'intersection': 'and',
            'exists': 'some', //
            'forall': 'all',  //
            'subclass': 'subclassOf',
            'equivalent': 'equivalentTo'
        }
    },
    'plain': {
        'dl': { // maybe add some spans around it
            'union': '⊔',
            'intersection': '⊓',
            'exists': '∃',
            'forall': '∀',
            'subclass': '⊑',
            'equivalent': '≡'
        },
        'manchester': {
            'union': 'or',
            'intersection': 'and',
            'exists': 'some', //
            'forall': 'all',  //
            'subclass': 'subclassOf',
            'equivalent': 'equivalentTo'
        }
    },
}

export { SYMBOLS_DICT }