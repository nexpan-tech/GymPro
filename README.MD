git add .
git commit -m "UI & Theme change corrected"
git push origin main

First check history: git log --oneline

Then pick a commit like: git reset --hard <commit-id>

Create backup branch first: git checkout -b backup-before-reset

Then go back:git checkout main
git reset --hard HEAD
git clean -fd

You can always recover with: git reflog

tree -I 'node_modules|build|dist|.git|.vscode' -a