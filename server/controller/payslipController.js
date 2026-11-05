const PDFDocument = require('pdfkit');
const Payroll = require('../models/payroll');
const Employee = require('../models/employee');

// Generate and download a PDF payslip.
const downloadPayslip = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the requested payroll record.
    const payroll = await Payroll.findById(id)
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('salaryStructure');

    if (!payroll || !payroll.employee) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found.'
      });
    }

    // Employees can download only their own payslips.
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({
        user: req.user.id
      });

      if (
        !employee ||
        payroll.employee._id.toString() !== employee._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to access this payslip.'
        });
      }
    }

    // Only approved or paid payroll records can become payslips.
    if (!['approved', 'paid'].includes(payroll.status)) {
      return res.status(400).json({
        success: false,
        message: 'Payslip is available only after payroll approval.'
      });
    }

    const employeeName = payroll.employee.user?.name || 'Employee';
    const employeeId = payroll.employee.employeeId || 'N/A';
    const email = payroll.employee.user?.email || 'N/A';

    const monthName = new Date(
      payroll.payrollYear,
      payroll.payrollMonth - 1
    ).toLocaleString('en-IN', { month: 'long' });

    const filename = `Payslip_${employeeId}_${monthName}_${payroll.payrollYear}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    // Header.
    doc.fontSize(22).font('Helvetica-Bold')
      .text('TRACKPAY', { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(16).font('Helvetica')
      .text('EMPLOYEE PAYSLIP', { align: 'center' });

    doc.moveDown();
    doc.fontSize(12)
      .text(`Pay Period: ${monthName} ${payroll.payrollYear}`);

    doc.moveDown();

    // Employee details.
    doc.font('Helvetica-Bold').text('EMPLOYEE DETAILS');
    doc.moveDown(0.5);

    doc.font('Helvetica')
      .text(`Employee Name: ${employeeName}`)
      .text(`Employee ID: ${employeeId}`)
      .text(`Email: ${email}`)
      .text(`Working Days: ${payroll.workingDays}`)
      .text(`Present Days: ${payroll.presentDays}`)
      .text(`Absent Days: ${payroll.absentDays}`)
      .text(`Overtime Hours: ${payroll.overtimeHours}`);

    doc.moveDown();

    // Earnings.
    doc.font('Helvetica-Bold').text('EARNINGS');
    doc.moveDown(0.5);

    doc.font('Helvetica')
      .text(`Basic Earnings: Rs. ${payroll.basicEarnings.toFixed(2)}`)
      .text(`Total Allowances: Rs. ${payroll.totalAllowances.toFixed(2)}`)
      .text(`Incentives: Rs. ${payroll.incentives.toFixed(2)}`)
      .text(`Overtime Pay: Rs. ${payroll.overtimePay.toFixed(2)}`);

    doc.moveDown();
    doc.font('Helvetica-Bold')
      .text(`GROSS SALARY: Rs. ${payroll.grossSalary.toFixed(2)}`);

    doc.moveDown();

    // Deductions and net salary.
    doc.font('Helvetica-Bold').text('DEDUCTIONS');
    doc.moveDown(0.5);

    doc.font('Helvetica')
      .text(`Total Deductions: Rs. ${payroll.totalDeductions.toFixed(2)}`);

    doc.moveDown();
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text(`NET SALARY: Rs. ${payroll.netSalary.toFixed(2)}`);

    doc.moveDown();
    doc.fontSize(10).font('Helvetica')
      .text(`Payroll Status: ${payroll.status.toUpperCase()}`)
      .text('This is a computer-generated payslip.');

    doc.end();
  } catch (error) {
    console.error('Payslip download error:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Unable to generate payslip.'
      });
    }

    res.destroy(error);
  }
};

module.exports = { downloadPayslip };