First boot takes 3–5 minutes; the UI returns 502 until GitLab finishes starting. Needs at least 4 GB RAM.

Sign in as `root` with the generated `GITLAB_ROOT_PASSWORD`. Change it after first login.

GitLab stores its external URL in `/etc/gitlab/gitlab.rb` on first boot. If you attach a custom domain later, update `GITLAB_EXTERNAL_URL` and redeploy so the config is regenerated.
