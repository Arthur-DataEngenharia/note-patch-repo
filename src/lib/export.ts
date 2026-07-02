import { jsPDF } from 'jspdf';
import type { NotePatch } from '@/types';
import { formatDate } from './utils';

export function exportPatchToPdf(patch: NotePatch) {
  const doc = new jsPDF();
  const margin = 15;
  let y = 20;

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(225, 29, 72);
  doc.setFontSize(10);
  doc.text('NOTE PATCH REPOSITORY', margin, 15);
  doc.setTextColor(250, 250, 250);
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(patch.title, 180);
  doc.text(titleLines, margin, 25);

  y = 50;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.text(`Versão: ${patch.version}`, margin, y);
  doc.text(`Status: ${patch.status}`, margin + 70, y);
  doc.text(`Deploy: ${formatDate(patch.deployedAt)}`, margin + 130, y);

  y += 12;
  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text('Resumo Executivo', margin, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(patch.summary, 180);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  doc.setFontSize(12);
  doc.setTextColor(225, 29, 72);
  doc.text('Notas Técnicas', margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const notesText = patch.technicalNotes.replace(/[#*`>|]/g, '').trim();
  const notesLines = doc.splitTextToSize(notesText, 180);
  notesLines.forEach((line: string) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y);
    y += 5;
  });

  if (patch.rollbackPlan) {
    y += 8;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(225, 29, 72);
    doc.text('Plano de Rollback', margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const rbLines = doc.splitTextToSize(patch.rollbackPlan, 180);
    doc.text(rbLines, margin, y);
  }

  doc.save(`note-patch-${patch.version}.pdf`);
}

export function exportPatchToMarkdown(patch: NotePatch) {
  const md = `# ${patch.title}

**Versão:** ${patch.version}
**Status:** ${patch.status}
**Deploy:** ${formatDate(patch.deployedAt)}
**Tags:** ${patch.tags.map((t) => `\`${t}\``).join(', ')}

## Resumo Executivo

${patch.summary}

## Notas Técnicas

${patch.technicalNotes}

${patch.githubRepo ? `## GitHub\n\n- **Repo:** ${patch.githubRepo}\n- **Branch:** ${patch.githubBranch ?? '—'}\n- **Commit:** ${patch.githubCommitSha ?? '—'}\n${patch.githubPrUrl ? `- **PR:** ${patch.githubPrUrl}` : ''}\n` : ''}
${patch.affectedClasses.length > 0 ? `## Classes Afetadas\n\n${patch.affectedClasses.map((c) => `- \`${c.className}\` — ${c.filePath}${c.lineRange ? `:${c.lineRange}` : ''}`).join('\n')}\n` : ''}
${patch.impactedSystems.length > 0 ? `## Sistemas Impactados\n\n${patch.impactedSystems.map((s) => `- ${s}`).join('\n')}\n` : ''}
${patch.rollbackPlan ? `## Plano de Rollback\n\n${patch.rollbackPlan}\n` : ''}
## Checklist

${patch.checklist.map((c) => `- [${c.checked ? 'x' : ' '}] ${c.label}${c.checkedBy ? ` (${c.checkedBy})` : ''}`).join('\n')}
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `note-patch-${patch.version}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAuditToCsv(rows: { timestamp: string; user: string; action: string; entity: string; detail: string }[]) {
  const header = 'Timestamp;Usuário;Ação;Entidade;Detalhe';
  const lines = rows.map((r) => `${r.timestamp};${r.user};${r.action};${r.entity};${r.detail}`);
  const csv = [header, ...lines].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'auditoria.csv';
  a.click();
  URL.revokeObjectURL(url);
}
