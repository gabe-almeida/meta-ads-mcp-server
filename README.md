# Meta Ads MCP Server

A Model Context Protocol (MCP) server for programmatic management of Meta (Facebook/Instagram) advertising campaigns through AI assistants.

## Features

- **Campaign Management**: Create, read, update, and delete advertising campaigns
- **Ad Set Management**: Configure targeting, budgets, and optimization goals
- **Creative Management**: Upload media and create ad creatives
- **Analytics & Insights**: Retrieve performance data with breakdowns and custom metrics
- **Audience Management**: Create and manage custom, lookalike, and saved audiences
- **Conversion Tracking**: Set up pixels and custom conversion events
- **Production-Ready**: Built-in retry logic, rate limiting, and error handling

## Installation

```bash
npm install
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Meta access token:
```
META_ACCESS_TOKEN=your_token_here
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "node",
      "args": ["/path/to/meta-ads-mcp-server/build/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector build/index.js
```

## Development

```bash
# Watch mode for development
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Tool Reference](docs/TOOLS.md)
- [Usage Examples](docs/EXAMPLES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Requirements

- Node.js >= 20.0.0
- Meta developer account
- Valid Meta access token with `ads_management` and `ads_read` permissions

## License

MIT

## Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for details.

## Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/yourusername/meta-ads-mcp-server/issues)
- Documentation: [Read the docs](docs/)

## Resources

- [Meta Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Meta Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk)
