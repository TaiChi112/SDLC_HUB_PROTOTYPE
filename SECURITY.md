# Security Policy

## Reporting Security Vulnerabilities

**Do not open public issues for security vulnerabilities.**

If you discover a security vulnerability, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Affected version(s)
- Suggested fix (if you have one)

We will acknowledge receipt within 48 hours and provide updates on the progress of our investigation.

## Security Best Practices

### For Contributors
- Never commit `.env`, `.env.local`, or secrets to the repository
- Use `.env.example` templates for configuration
- Review code for SQL injection, XSS, and other common vulnerabilities
- Keep dependencies updated
- Use strong authentication (OAuth2 with NextAuth)

### For Deployment
- Use HTTPS in production
- Implement rate limiting on API endpoints
- Validate and sanitize all user inputs
- Use environment variables for sensitive data
- Keep secrets in secure vaults (not git)
- Implement CORS properly
- Use CSRF tokens for state-changing operations
- Log security-relevant events

### Dependencies
We regularly update dependencies to patch security vulnerabilities. Check:
```bash
# Frontend
cd frontend
npm audit
npm audit fix

# Backend
cd backend
pip-audit
```

## Production Checklist

Before deploying to production, ensure:

- [ ] All secrets moved to environment variables
- [ ] HTTPS/TLS enabled
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSRF protection in place
- [ ] Security headers set (CSP, X-Frame-Options, etc.)
- [ ] Audit logging enabled
- [ ] Regular security audits scheduled

## Responsible Disclosure

We appreciate responsible disclosure and will credit researchers who help us improve security.

---

Thank you for helping keep Blueprint Hub secure!
