import 'babel-core/register'
import 'babel-polyfill'

import GitHubApi from 'github'
import { render } from 'mustache'
import { asc as sortVersions } from 'semver-sort'

const TEMPLATE = `
# [What's New in {{newTag.name}}]({{{compareUrl}}})

This is a summary of the differences between [{{newTag.name}}]({{{newTag.url}}}) and [{{previousTag.name}}]({{{previousTag.url}}}).

## Commits

<details>
<summary><strong>Show commits</strong></summary>

| SHA | Author | Message |
| --- | ------ | ------- |
{{#commits}}
| [\`{{{id}}}\`]({{{url}}}) | [{{author.name}}]({{{author.url}}}) | {{{message}}} |
{{/commits}}
</details>

## Changed files

{{#files}}
#### {{icon}} [\`{{{filename}}}\`]({{{url}}})

{{#diff}}
<details>
<summary><strong>Show changes</strong></summary>

\`\`\`diff
{{{.}}}
\`\`\`
</details>
{{/diff}}
{{^diff}}
*Inline diff not displayed. [View the whole file]({{{url}}})*
{{/diff}}

{{/files}}
`.trim()

export const NO_PREVIOUS_RELEASE = new Error('No previous release found')

export default async ({
  token,
  owner,
  repo,
  tag,
  showDiff,
  apiOptions = {},
}) => {
  const gitHub = new GitHubApi(apiOptions)
  gitHub.authenticate({ type: 'oauth', token })

  const { newTag, previousTag } = await fetchTags(gitHub, { owner, repo, tag })
  const { compareUrl, commits, files } = await fetchDiff(gitHub, {
    owner,
    repo,
    newTag,
    previousTag,
  })
  const body = await renderBody({
    owner,
    repo,
    showDiff,
    newTag,
    previousTag,
    compareUrl,
    commits,
    files,
  })

  return await createRelease(gitHub, { owner, repo, newTag, body })
}

const fetchTags = async (gitHub, { owner, repo, tag }) => {
  const { data } = await gitHub.gitdata.getTags({ owner, repo })
  const tags = sortVersions(data.map(_tag => _tag.ref.split('/').pop()))

  const newTagIndex = tags.findIndex(_tag => _tag === tag)

  if (newTagIndex < 0) {
    throw new Error(`Could not find tag ${tag}`)
  }

  if (newTagIndex === 0) {
    throw NO_PREVIOUS_RELEASE
  }

  return {
    newTag: tags[newTagIndex],
    previousTag: tags[newTagIndex - 1],
  }
}

const fetchDiff = async (gitHub, { owner, repo, newTag, previousTag }) => {
  const { data } = await gitHub.repos.compareCommits({
    owner,
    repo,
    base: previousTag,
    head: newTag,
  })
  return {
    compareUrl: data.html_url,
    commits: data.commits.map(commit => ({
      id: commit.sha.substr(0, 7),
      url: commit.html_url,
      author: {
        name: commit.author.login,
        url: commit.author.html_url,
      },
      message: commit.commit.message,
    })),
    files: data.files.map(file => ({
      filename: file.filename,
      url: file.blob_url,
      status: file.status,
      diff: file.patch || null,
    })),
  }
}

const renderBody = async ({
  owner,
  repo,
  showDiff = () => true,
  newTag,
  previousTag,
  compareUrl,
  commits,
  files,
}) =>
  render(TEMPLATE, {
    compareUrl,
    newTag: {
      name: newTag,
      url: `https://github.com/${owner}/${repo}/tree/${newTag}`,
    },
    previousTag: {
      name: previousTag,
      url: `https://github.com/${owner}/${repo}/tree/${previousTag}`,
    },
    commits: commits.map(commit => ({
      ...commit,
      message: commit.message.replace(/[\r\n]+/g, '<br>'),
    })),
    files: files.map(file => ({
      ...file,
      diff: file.diff && showDiff(file) && file.diff.replace(/`/g, '\\`'),
    })),
    icon() {
      return {
        added: ':heavy_plus_sign:',
        modified: '',
        removed: ':heavy_minus_sign:',
      }[this.status]
    },
  })

const createRelease = async (gitHub, { owner, repo, newTag, body }) => {
  const { data } = await gitHub.repos.createRelease({
    owner,
    repo,
    tag_name: newTag,
    name: newTag,
    body,
  })
  return data.html_url
}
