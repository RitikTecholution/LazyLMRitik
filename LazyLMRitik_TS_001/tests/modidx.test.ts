import unittest
from src.lazy_lm.modidx import d

class TestModIdx(unittest.TestCase):
    def test_module_index_structure(self):
        self.assertIsInstance(d, dict)
        self.assertIn('settings', d)
        self.assertIn('syms', d)

    def test_settings(self):
        settings = d['settings']
        self.assertIsInstance(settings, dict)
        self.assertIn('docstring_style', settings)
        self.assertIn('qualifier', settings)

    def test_symbols(self):
        syms = d['syms']
        self.assertIsInstance(syms, dict)
        # Add more specific tests for symbols if needed

    def test_docstring_style(self):
        self.assertEqual(d['settings']['docstring_style'], 'numpy')

    def test_qualifier(self):
        self.assertEqual(d['settings']['qualifier'], 'lazy_lm')

if __name__ == '__main__':
    unittest.main()