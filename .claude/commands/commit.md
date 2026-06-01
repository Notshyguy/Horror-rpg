Smart semantic commit.

1. Review changes with `git status` and `git diff`.
2. Run `npm test` first; do not commit if tests fail (fix or report instead).
3. Write a semantic commit message: `type(scope): description`
   (types: feat, fix, chore, refactor, perf, docs).
4. Run `git add -A && git commit -m "<message>"`.
5. Print the commit hash and message. If there are no changes, say so and stop.
