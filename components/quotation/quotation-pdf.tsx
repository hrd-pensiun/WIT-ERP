"use client"

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { QuotationData, ManpowerRow } from './quotation-types'

export type { QuotationData, ManpowerRow }

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    color: '#1a1a1a',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  headerLeft: { width: '45%' },
  headerRight: { width: '50%', alignItems: 'flex-end' },
  labelText: { fontSize: 8, color: '#666', marginBottom: 1 },
  valueText: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  titleBig: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitleBig: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  codeText: { fontSize: 9, color: '#333', marginBottom: 2 },
  dateText: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  validText: { fontSize: 8, fontStyle: 'italic', color: '#555' },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#ccc', marginBottom: 12 },
  sectionHeader: {
    backgroundColor: '#c0392b',
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'white' },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  sectionBody: {
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderTopWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#999',
    paddingBottom: 4,
    marginBottom: 0,
  },
  tableHeaderText: { fontSize: 8, color: '#555' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 7,
  },
  cellItem: { width: '45%' },
  cellMode: { width: '30%' },
  cellPrice: { width: '25%', alignItems: 'flex-end' },
  cellText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  cellSubtext: { fontSize: 8, color: '#555' },
  bulletRow: { flexDirection: 'row', marginBottom: 5 },
  bullet: { width: 12, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  termRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  termText: { fontSize: 8.5, lineHeight: 1.4, color: '#333' },
  footer: { position: 'absolute', bottom: 24, left: 50, right: 50 },
  footerText: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
})

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

export function QuotationPDF({ data }: { data: QuotationData }) {
  const scopeLines = (data.scope_of_work ?? '').split('\n').filter(Boolean)
  const termsLines = (data.terms_and_conditions ?? '').split('\n').filter(Boolean)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* Left: client info */}
          <View style={styles.headerLeft}>
            {[
              { label: 'Client Name', value: data.client_name || '—' },
              { label: 'Company', value: data.company_name || '—' },
              { label: 'Address', value: data.company_address || '—' },
              { label: 'Phone Number', value: data.contact_phone || '—' },
            ].map((r) => (
              <View key={r.label} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ width: 80, fontSize: 8, color: '#444' }}>{r.label}</Text>
                <Text style={{ flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{r.value}</Text>
              </View>
            ))}
          </View>
          {/* Right: quotation title */}
          <View style={styles.headerRight}>
            <Text style={styles.titleBig}>Summary Quotation</Text>
            <Text style={styles.subtitleBig}>{data.project_type}</Text>
            <Text style={styles.codeText}>{data.quotation_number}</Text>
            <Text style={styles.dateText}>{data.date}</Text>
            <Text style={styles.validText}>Valid for {data.valid_days} days</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* SCOPE OF WORKS */}
        {scopeLines.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionHeaderText}>Scope of Works</Text>
            </View>
            <View style={[styles.sectionBody, { paddingTop: 10 }]}>
              {scopeLines.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>{'•'}</Text>
                  <Text style={styles.bulletText}>{line.replace(/^[-•*]\s*/, '')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* MANPOWER COST */}
        {data.manpower_rows.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionHeaderText}>Manpower Cost</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: '45%' }]}>Item</Text>
                <Text style={[styles.tableHeaderText, { width: '30%' }]}>Work Mode</Text>
                <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'right' }]}>Price</Text>
              </View>
              {data.manpower_rows.map((row, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.cellItem}>
                    <Text style={styles.cellText}>{row.role_name}</Text>
                    {(row.qty > 1 || row.months > 1) && (
                      <Text style={styles.cellSubtext}>
                        {row.qty} orang · {row.months} bulan
                      </Text>
                    )}
                  </View>
                  <View style={styles.cellMode}>
                    <Text style={styles.cellText}>{row.work_mode || 'Remote'}</Text>
                  </View>
                  <View style={styles.cellPrice}>
                    <Text style={styles.cellText}>{fmtIDR(row.publish_rate)} / Month</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TERMS & CONDITIONS */}
        {termsLines.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionHeaderText}>Terms & Condition</Text>
            </View>
            <View style={styles.sectionBody}>
              {termsLines.map((line, i) => (
                <View
                  key={i}
                  style={[
                    styles.termRow,
                    i === termsLines.length - 1 ? { borderBottomWidth: 0 } : {},
                  ]}
                >
                  <Text style={styles.termText}>{line.replace(/^[-•*]\s*/, '')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>(CONFIDENTIAL)</Text>
        </View>
      </Page>
    </Document>
  )
}
