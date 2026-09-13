# Publish GRIDRUNNER v7 on GitHub Pages

The game is already static and uses relative module/asset URLs, so it supports a repository subpath without rebuilding. The included workflow uploads only dist/.

1. Create or choose a GitHub repository and put this source at its root. Keep the .github/workflows/pages.yml file and dist directory. The ZIP may extract into a containing GRIDRUNNER folder: upload its contents, not that extra folder.
2. Use main as the deployment branch, or change the branch filter in pages.yml to match your default branch.
3. In the repository, open Settings → Pages. Under Build and deployment, select GitHub Actions as the source.
4. Push to main, or run “Publish GRIDRUNNER to GitHub Pages” from Actions.
5. Wait for a successful deployment. Open the URL shown by the github-pages environment or Settings → Pages.

No personal access token needs to be added to the workflow. It uses GitHub's built-in workflow token with read access to source and Pages deployment permissions. Repository/organization rules may require an environment approval.

The current game remains available at https://gridrunner.goodyartist.chatgpt.site. This source repository is https://github.com/charltonty/GRIDRUNNER. Enable GitHub Pages with GitHub Actions as its publishing source, then run the included workflow.

Saves belong to each website's browser origin. Before moving, export your save from the existing game's Save / Load menu, then import it on GitHub Pages. Nothing automatically copies between these two origins.

Official setup documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
Workflow reference: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
