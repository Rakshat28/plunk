![card.png](/assets/card.png)

<h1 align="center">Plunk</h1>

<p align="center">
    The Open-Source Email Platform
</p>

<p align="center">
    <img src="https://img.shields.io/github/contributors/useplunk/plunk"/>
    <img src="https://img.shields.io/github/actions/workflow/status/useplunk/plunk/docker-publish.yml"/>
    <img src="https://img.shields.io/github/license/useplunk/plunk"/>
    <img src="https://img.shields.io/github/stars/useplunk/plunk"/>
</p>

## Introduction

Plunk is an open-source email platform built on top of AWS SES. It allows you to easily send emails from your
applications.
It can be considered as a self-hosted alternative to services
like [SendGrid](https://sendgrid.com/), [Resend](https://resend.com) or [Mailgun](https://www.mailgun.com/).

## Features

- **Transactional Emails**: Send emails straight from your API with template support and variable substitution
- **Campaigns**: Send newsletters and product updates to large audiences with segmentation
- **Workflows**: Create advanced automations with triggers, delays, and conditional logic
- **Contact Management**: Organize contacts with custom fields and dynamic segmentation
- **Analytics**: Track opens, clicks, bounces, and engagement metrics in real-time
- **Custom Domains**: Verify and send from your own domains with DKIM/SPF support

## Sponsors

Plunk is made possible by the support of our sponsors. If you self-host Plunk, consider supporting
via [GitHub Sponsors](https://github.com/sponsors/driaug).

## Self-hosting Plunk

The easiest way to self-host Plunk is by using the `plunk` Docker image.
You can pull the latest image from [Github](https://github.com/useplunk/plunk/pkgs/container/plunk).

A complete guide on how to deploy Plunk can be found in
the [documentation](https://docs.useplunk.com/self-hosting/introduction).

## Contributing

You are welcome to contribute to Plunk. You can find a guide on how to contribute in [CONTRIBUTING.md](CONTRIBUTING.md).

<a href="https://github.com/useplunk/plunk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=useplunk/plunk" />
</a>

## License

AGPL-3.0 License - see [LICENSE](LICENSE) for details.
