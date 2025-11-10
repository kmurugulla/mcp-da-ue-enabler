// src/lib/github-client.js
import { Octokit } from '@octokit/rest';

let octokitInstance = null;

/**
 * Get or create Octokit client instance
 */
export function getGitHubClient() {
  if (!octokitInstance) {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable not set. Required for GitHub operations.');
    }
    
    octokitInstance = new Octokit({
      auth: token,
    });
  }
  
  return octokitInstance;
}

/**
 * Get file content from GitHub repository
 */
export async function getFileContent({ org, repo, path, branch = 'main' }) {
  const client = getGitHubClient();
  
  try {
    const { data } = await client.repos.getContent({
      owner: org,
      repo,
      path,
      ref: branch,
    });
    
    if (data.type !== 'file') {
      throw new Error(`${path} is not a file`);
    }
    
    // Decode base64 content
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    if (error.status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    throw new Error(`Failed to fetch file from GitHub: ${error.message}`);
  }
}

/**
 * Get directory contents from GitHub repository
 */
export async function getDirectoryContents({ org, repo, path, branch = 'main' }) {
  const client = getGitHubClient();
  
  try {
    const { data } = await client.repos.getContent({
      owner: org,
      repo,
      path,
      ref: branch,
    });
    
    if (!Array.isArray(data)) {
      throw new Error(`${path} is not a directory`);
    }
    
    return data;
  } catch (error) {
    if (error.status === 404) {
      throw new Error(`Directory not found: ${path}`);
    }
    throw new Error(`Failed to fetch directory from GitHub: ${error.message}`);
  }
}

/**
 * Check if file exists in GitHub repository
 */
export async function fileExists({ org, repo, path, branch = 'main' }) {
  const client = getGitHubClient();
  
  try {
    await client.repos.getContent({
      owner: org,
      repo,
      path,
      ref: branch,
    });
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

export default {
  getGitHubClient,
  getFileContent,
  getDirectoryContents,
  fileExists,
};


