const archiveService = require('../services/archiveService');
const PDFDocument = require('pdfkit');

const getStatusIndonesian = (status) => {
    switch (status) {
        case 'Confirmed': return 'Menunggu';
        case 'Calling': return 'Dipanggil';
        case 'On Treatment': return 'Sedang Diperiksa';
        case 'Completed': return 'Selesai';
        case 'Skipped': return 'Dilewati';
        default: return status;
    }
};

const buildFilterSummary = (filters) => {
    const active = [];
    if (filters.date) active.push(`Tanggal Kunjungan: ${filters.date}`);
    if (filters.doctor_id) active.push(`Dokter: ID ${filters.doctor_id}`);
    if (filters.specialization) active.push(`Spesialisasi: ${filters.specialization}`);
    if (filters.status) active.push(`Status: ${getStatusIndonesian(filters.status)}`);
    if (filters.time_slot) active.push(`Slot Waktu: ${filters.time_slot}`);
    if (filters.search) active.push(`Pencarian: "${filters.search}"`);

    if (active.length === 0) return 'Filter: Semua Data';
    return 'Filter:\n' + active.join('\n');
};

const exportCsv = async (req, res) => {
    try {
        const filters = {
            date: req.query.date,
            status: req.query.status,
            doctor_id: req.query.doctor_id,
            specialization: req.query.specialization,
            time_slot: req.query.time_slot,
            search: req.query.search
        };

        const data = await archiveService.getExportData(filters);

        const escapeCsv = (str) => {
            if (str == null) return '';
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        let csvString = 'No,Kode Booking,Tanggal Kunjungan,Nomor Antrean,Nama Pasien,Dokter,Spesialisasi,Slot Waktu,Status\n';
        
        data.forEach((b, index) => {
            const row = [
                index + 1,
                b.booking_code,
                new Date(b.visit_date).toLocaleDateString('id-ID'),
                b.queue_number,
                b.patient.name,
                b.schedule.doctor.name,
                b.schedule.doctor.specialization,
                b.time_slot,
                getStatusIndonesian(b.status)
            ];
            csvString += row.map(escapeCsv).join(',') + '\n';
        });

        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="arsip-booking-klinik-${dateStr}.csv"`);
        
        // Output BOM for Excel UTF-8 compatibility
        res.write('\uFEFF');
        res.write(csvString);
        res.end();

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
};

const exportPdf = async (req, res) => {
    try {
        const filters = {
            date: req.query.date,
            status: req.query.status,
            doctor_id: req.query.doctor_id,
            specialization: req.query.specialization,
            time_slot: req.query.time_slot,
            search: req.query.search
        };

        const data = await archiveService.getExportData(filters);

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="arsip-booking-klinik-${dateStr}.pdf"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Arsip Booking Klinik', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.fontSize(10).text(`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}`, { align: 'right' });
        doc.moveDown(1);

        // Filters
        doc.fontSize(10).text(buildFilterSummary(filters));
        doc.moveDown(1);

        // Table Header
        const startY = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('No.', 30, startY, { width: 30 });
        doc.text('Kode Booking', 60, startY, { width: 100 });
        doc.text('Tanggal', 160, startY, { width: 80 });
        doc.text('Pasien', 240, startY, { width: 120 });
        doc.text('Dokter', 360, startY, { width: 120 });
        doc.text('Spesialisasi', 480, startY, { width: 100 });
        doc.text('Waktu', 580, startY, { width: 80 });
        doc.text('Status', 660, startY, { width: 100 });
        doc.font('Helvetica');

        let currentY = startY + 20;

        // Table Rows
        data.forEach((b, index) => {
            // Check if we need to add a new page
            if (currentY > 530) {
                doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
                currentY = 30;
            }

            doc.text((index + 1).toString(), 30, currentY, { width: 30 });
            doc.text(b.booking_code, 60, currentY, { width: 100 });
            doc.text(new Date(b.visit_date).toLocaleDateString('id-ID'), 160, currentY, { width: 80 });
            doc.text(b.patient.name, 240, currentY, { width: 120 });
            doc.text(b.schedule.doctor.name, 360, currentY, { width: 120 });
            doc.text(b.schedule.doctor.specialization, 480, currentY, { width: 100 });
            doc.text(b.time_slot, 580, currentY, { width: 80 });
            doc.text(getStatusIndonesian(b.status), 660, currentY, { width: 100 });

            currentY += 20;
        });

        doc.end();

    } catch (error) {
        // If error occurs after headers sent, we can't do much. But if before:
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Failed to export PDF' });
        }
    }
};

module.exports = {
    exportCsv,
    exportPdf
};
