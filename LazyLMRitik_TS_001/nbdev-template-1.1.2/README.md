# nbdev template

Use this template to more easily create your [nbdev](https://nbdev.fast.ai/) project.

_If you are using an older version of this template, and want to upgrade to the theme-based version, see [this helper script](https://gist.github.com/hamelsmu/977e82a23dcd8dcff9058079cb4a8f18) (more explanation of what this means is contained in the link to the script)_.

## Troubleshooting Tips

-  Make sure you are using the latest version of nbdev with `pip install -U nbdev`
-  If you are using an older version of this template, you can upgrade to the new theme-based version with `nbdev_upgrade_template`.
-  If you are having git conflicts, make sure that you pull from the repo before making changes on your local machine.
-  If you are still having git conflicts, you can remove your local copy of the repository and clone it again.

## Differences from the original template

This README has been updated to reflect the changes made to the project structure:

1. The project now uses TypeScript instead of Python.
2. The `setup.py` file has been replaced with a `package.json` file for Node.js/TypeScript projects.
3. The `lazy_lm` directory has been replaced with a `src` directory containing TypeScript files.
4. Test files are now located in a `tests` directory and use Jest for testing.

## Getting Started

1. Click the "Use this template" button to create a new repository based on this template.
2. Clone your new repository to your local machine.
3. Install the required dependencies by running `npm install` in the project root.
4. Start developing your TypeScript-based nbdev project!

For more information on using nbdev with TypeScript, please refer to the nbdev documentation and TypeScript-specific guides.