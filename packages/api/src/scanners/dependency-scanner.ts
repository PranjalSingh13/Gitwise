export interface OSVAdvisory {
  packageName: string;
  ecosystem: 'npm' | 'pypi';
  installedVersion: string;
  vulnerabilityId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  details?: string;
  fixedVersion?: string;
  advisoryUrl: string;
}

export async function scanPackageJson(packageJsonRaw: string): Promise<OSVAdvisory[]> {
  const advisories: OSVAdvisory[] = [];
  let parsed: any;

  try {
    parsed = JSON.parse(packageJsonRaw);
  } catch {
    return advisories;
  }

  const dependencies: Record<string, string> = {
    ...(parsed.dependencies || {}),
    ...(parsed.devDependencies || {})
  };

  const packageEntries = Object.entries(dependencies).slice(0, 30); // sample top 30 to avoid rate limits

  for (const [pkg, versionSpec] of packageEntries) {
    const cleanVersion = versionSpec.replace(/[\^~>=<]/g, '').trim();
    if (!cleanVersion || cleanVersion === 'latest' || cleanVersion.startsWith('*')) {
      continue;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: cleanVersion,
          package: {
            name: pkg,
            ecosystem: 'npm'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json() as any;
      if (data.vulns && data.vulns.length > 0) {
        for (const vuln of data.vulns.slice(0, 2)) {
          let fixedVersion = '';
          const ranges = vuln.affected?.[0]?.ranges || [];
          for (const r of ranges) {
            for (const ev of r.events || []) {
              if (ev.fixed) fixedVersion = ev.fixed;
            }
          }

          let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
          const sevStr = vuln.database_specific?.severity?.toLowerCase() || '';
          if (sevStr.includes('crit')) severity = 'critical';
          else if (sevStr.includes('high')) severity = 'high';
          else if (sevStr.includes('low')) severity = 'low';

          advisories.push({
            packageName: pkg,
            ecosystem: 'npm',
            installedVersion: cleanVersion,
            vulnerabilityId: vuln.id,
            severity,
            summary: vuln.summary || vuln.id,
            details: vuln.details ? vuln.details.substring(0, 250) + '...' : undefined,
            fixedVersion: fixedVersion || undefined,
            advisoryUrl: `https://osv.dev/vulnerability/${vuln.id}`
          });
        }
      }
    } catch {
      // Ignore individual network hiccups in dependency checking
    }
  }

  return advisories;
}
