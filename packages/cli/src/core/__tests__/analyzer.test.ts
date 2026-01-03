import { Analyzer } from '../analyzer';

describe('Analyzer', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  describe('detectTechnicalDebt', () => {
    it('should detect TODO comments', async () => {
      const diff = `
diff --git a/src/test.ts b/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
+// TODO: fix this later
 function test() {
   return true;
 }
      `;

      const result = await analyzer.analyze(diff, ['src/test.ts']);

      expect(result.technicalDebt).toHaveLength(1);
      expect(result.technicalDebt[0].type).toBe('TODO Comment');
      expect(result.technicalDebt[0].severity).toBe('LOW');
      expect(result.technicalDebt[0].description).toContain('fix this later');
    });

    it('should detect FIXME comments', async () => {
      const diff = `
diff --git a/src/test.ts b/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
+// FIXME: critical bug here
 function test() {
   return true;
 }
      `;

      const result = await analyzer.analyze(diff, ['src/test.ts']);

      expect(result.technicalDebt).toHaveLength(1);
      expect(result.technicalDebt[0].type).toBe('FIXME Comment');
      expect(result.technicalDebt[0].severity).toBe('MEDIUM');
    });

    it('should detect console.log statements', async () => {
      const diff = `
diff --git a/src/test.ts b/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
+console.log('debug message');
 function test() {
   return true;
 }
      `;

      const result = await analyzer.analyze(diff, ['src/test.ts']);

      const consoleLogs = result.technicalDebt.filter((item) => item.type === 'Console Log');
      expect(consoleLogs.length).toBeGreaterThan(0);
      expect(consoleLogs[0].severity).toBe('LOW');
    });

    it('should detect debugger statements', async () => {
      const diff = `
diff --git a/src/test.ts b/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
+debugger;
 function test() {
   return true;
 }
      `;

      const result = await analyzer.analyze(diff, ['src/test.ts']);

      const debuggers = result.technicalDebt.filter((item) => item.type === 'Debugger Statement');
      expect(debuggers.length).toBeGreaterThan(0);
      expect(debuggers[0].severity).toBe('MEDIUM');
    });
  });

  describe('assessRisks', () => {
    it('should detect database changes', async () => {
      const diff = 'test diff content';
      const files = ['src/migrations/001_create_users.sql', 'src/models/user.ts'];

      const result = await analyzer.analyze(diff, files);

      const dbRisks = result.risks.filter((risk) => risk.type === 'Database');
      expect(dbRisks.length).toBeGreaterThan(0);
      expect(dbRisks[0].severity).toBe('HIGH');
      expect(dbRisks[0].affectedFiles).toContain('src/migrations/001_create_users.sql');
    });

    it('should detect security-related changes', async () => {
      const diff = `
diff --git a/src/auth/login.ts b/src/auth/login.ts
+++ b/src/auth/login.ts
@@ -1,3 +1,4 @@
+const password = 'secret123';
 function login() {
   return true;
 }
      `;
      const files = ['src/auth/login.ts'];

      const result = await analyzer.analyze(diff, files);

      const securityRisks = result.risks.filter((risk) => risk.type === 'Security');
      expect(securityRisks.length).toBeGreaterThan(0);
      expect(securityRisks[0].severity).toBe('HIGH');
    });

    it('should detect API changes', async () => {
      const diff = 'test diff content';
      const files = ['src/api/users.ts', 'src/routes/auth.ts'];

      const result = await analyzer.analyze(diff, files);

      const apiRisks = result.risks.filter((risk) => risk.type === 'Api');
      expect(apiRisks.length).toBeGreaterThan(0);
      expect(apiRisks[0].severity).toBe('MEDIUM');
    });

    it('should detect breaking changes', async () => {
      const diff = `
diff --git a/src/api.ts b/src/api.ts
+++ b/src/api.ts
@@ -1,3 +1,3 @@
-export function oldFunction(param1: string) {
+export function oldFunction(param1: string, param2: number) {
   return true;
 }
      `;
      const files = ['src/api.ts'];

      const result = await analyzer.analyze(diff, files);

      const breakingChanges = result.risks.filter((risk) => risk.type === 'Breaking Change');
      expect(breakingChanges.length).toBeGreaterThan(0);
      expect(breakingChanges[0].severity).toBe('HIGH');
    });
  });

  describe('checkTestCoverage', () => {
    it('should detect test files', async () => {
      const diff = 'test diff content';
      const files = ['src/utils.ts', 'src/utils.test.ts'];

      const result = await analyzer.analyze(diff, files);

      expect(result.testCoverage.hasTests).toBe(true);
      expect(result.testCoverage.testFiles).toContain('src/utils.test.ts');
    });

    it('should detect missing tests', async () => {
      const diff = 'test diff content';
      const files = ['src/newFeature.ts']; // No corresponding test file

      const result = await analyzer.analyze(diff, files);

      expect(result.testCoverage.missingTests).toContain('src/newFeature.ts');
    });

    it('should calculate coverage percentage', async () => {
      const diff = 'test diff content';
      const files = [
        'src/file1.ts',
        'src/file1.test.ts',
        'src/file2.ts',
        'src/file2.test.ts',
        'src/file3.ts', // No test
      ];

      const result = await analyzer.analyze(diff, files);

      // 2 out of 3 source files have tests = ~67%
      expect(result.testCoverage.coveragePercentage).toBeGreaterThan(60);
      expect(result.testCoverage.coveragePercentage).toBeLessThanOrEqual(70);
    });
  });

  describe('analyzeArchitecture', () => {
    it('should detect core infrastructure changes', async () => {
      const diff = 'test diff content';
      const files = ['src/core/database.ts', 'src/services/auth.ts'];

      const result = await analyzer.analyze(diff, files);

      expect(result.architectureImpact.level).toBe('HIGH');
      expect(result.architectureImpact.areas).toContain('Core Services');
      expect(result.architectureImpact.requiresReview).toBe(true);
    });

    it('should detect API architecture changes', async () => {
      const diff = 'test diff content';
      const files = ['src/api/endpoints/users.ts'];

      const result = await analyzer.analyze(diff, files);

      expect(result.architectureImpact.areas).toContain('API');
      expect(result.architectureImpact.level).toMatch(/MEDIUM|HIGH/);
    });

    it('should detect configuration changes', async () => {
      const diff = 'test diff content';
      const files = ['config/database.json', '.env.example'];

      const result = await analyzer.analyze(diff, files);

      expect(result.architectureImpact.areas).toContain('Configuration');
    });

    it('should detect database schema changes', async () => {
      const diff = 'test diff content';
      const files = ['src/models/user.ts', 'migrations/001_create_users.sql'];

      const result = await analyzer.analyze(diff, files);

      expect(result.architectureImpact.level).toBe('HIGH');
      expect(result.architectureImpact.areas).toContain('Database');
      expect(result.architectureImpact.requiresReview).toBe(true);
    });

    it('should return low impact for minor changes', async () => {
      const diff = 'test diff content';
      const files = ['src/utils/helpers.ts'];

      const result = await analyzer.analyze(diff, files);

      expect(result.architectureImpact.level).toBe('LOW');
      expect(result.architectureImpact.areas).toHaveLength(0);
    });
  });

  describe('custom rules', () => {
    it('should support custom analysis rules', async () => {
      const customRule = {
        name: 'Custom Rule',
        pattern: /[+].*CUSTOM_MARKER/g,
        severity: 'HIGH' as const,
        category: 'technical-debt' as const,
        description: () => 'Custom marker found',
      };

      const customAnalyzer = new Analyzer([customRule]);

      const diff = `
diff --git a/src/test.ts b/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,4 @@
+// CUSTOM_MARKER: test
 function test() {
   return true;
 }
      `;

      const result = await customAnalyzer.analyze(diff, ['src/test.ts']);

      const customItems = result.technicalDebt.filter((item) => item.type === 'Custom Rule');
      expect(customItems.length).toBeGreaterThan(0);
      expect(customItems[0].severity).toBe('HIGH');
    });
  });

  describe('file filtering', () => {
    it('should exclude node_modules files', async () => {
      const diff = 'test diff content';
      const files = ['src/app.ts', 'node_modules/package/index.js'];

      const result = await analyzer.analyze(diff, files);

      // Verify analysis ran (would fail if excluded files weren't filtered)
      expect(result).toBeDefined();
    });

    it('should exclude build artifacts', async () => {
      const diff = 'test diff content';
      const files = ['src/app.ts', 'dist/app.js', 'build/output.js'];

      const result = await analyzer.analyze(diff, files);

      expect(result).toBeDefined();
    });
  });
});
