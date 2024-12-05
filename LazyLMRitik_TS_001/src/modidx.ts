// Autogenerated by nbdev

interface Settings {
    branch: string;
    doc_baseurl: string;
    doc_host: string;
    git_url: string;
    lib_path: string;
}

interface SymbolInfo {
    [key: string]: [string, string];
}

interface Symbols {
    [key: string]: {
        [key: string]: SymbolInfo;
    };
}

interface ModuleIndex {
    settings: Settings;
    syms: Symbols;
}

const d: ModuleIndex = {
    settings: {
        branch: 'main',
        doc_baseurl: '/lazy_lm',
        doc_host: 'https://Techolution.github.io',
        git_url: 'https://github.com/Techolution/lazy_lm',
        lib_path: 'lazy_lm'
    },
    syms: {
        'lazy_lm.core': {
            'lazy_lm.core.AnthropicVertex.lazy': ['core.html#anthropicvertex.lazy', 'lazy_lm/core.py'],
            'lazy_lm.core.LLM': ['core.html#llm', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient': ['core.html#lazyevaluationclient', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient.__init__': ['core.html#lazyevaluationclient.__init__', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient.ask_question': ['core.html#lazyevaluationclient.ask_question', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient.get_current_step': ['core.html#lazyevaluationclient.get_current_step', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient.get_next_step': ['core.html#lazyevaluationclient.get_next_step', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyEvaluationClient.initalize_problem': ['core.html#lazyevaluationclient.initalize_problem', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyState': ['core.html#lazystate', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyState.__post_init__': ['core.html#lazystate.__post_init__', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyState.add_step': ['core.html#lazystate.add_step', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyState.get_context': ['core.html#lazystate.get_context', 'lazy_lm/core.py'],
            'lazy_lm.core.LazyState.refresh': ['core.html#lazystate.refresh', 'lazy_lm/core.py']
        }
    }
};

export default d;