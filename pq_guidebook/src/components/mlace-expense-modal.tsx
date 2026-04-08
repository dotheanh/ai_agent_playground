import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExpenseData } from '@/hooks/use-expense-data';
import { formatVND, formatShort } from '@/lib/google-sheets-expense-fetcher';
import { Loader2 } from 'lucide-react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface MLACEExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MEMBER_NAMES = ['Bình', 'Nhi', 'Tân', 'Thuận', 'Triển', 'Thế Anh', 'Vy'];
const MEMBER_KEYS = ['binh', 'nhi', 'tan', 'thuan', 'trieu', 'theAnh', 'vy'] as const;

export function MLACEExpenseModal({ open, onOpenChange }: MLACEExpenseModalProps) {
  const { data, loading, error, fetchData, reset } = useExpenseData();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (open && !data) {
      fetchData();
    }
  }, [open, data, fetchData]);

  const toggleRow = (stt: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stt)) {
        newSet.delete(stt);
      } else {
        newSet.add(stt);
      }
      return newSet;
    });
  };

  const getParticipationCell = (value?: boolean | number) => {
    if (value === true) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    if (value === false) {
      return <X className="w-4 h-4 text-gray-500" />;
    }
    if (typeof value === 'number' && value !== 0) {
      return <span className="text-cyan-400 font-medium">{formatShort(value)}</span>;
    }
    return <span className="text-gray-500">-</span>;
  };

  const getMemberDetails = (item: any) => {
    return MEMBER_KEYS.map((key, idx) => {
      const value = (item as any)[key];
      return (
        <div key={key} className="flex justify-between py-1 border-b border-gray-700 last:border-0">
          <span className="text-gray-400">{MEMBER_NAMES[idx]}</span>
          <span className="text-cyan-400">{getParticipationCell(value)}</span>
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full !max-w-[85vw] max-h-[90vh] overflow-hidden flex flex-col bg-gray-900 border-cyan-500/30" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl text-cyan-400">📊 Chi tiêu team #mlace</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mr-3" />
              <span className="text-gray-300">Đang tải dữ liệu...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 py-8 text-center">
              ❌ {error}
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Transactions Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">📝 Danh sách chi tiêu</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-950/50 hover:bg-cyan-950/50">
                        <TableHead className="w-12 text-cyan-300">STT</TableHead>
                        <TableHead className="text-cyan-300 min-w-[200px]">Nội dung chi</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền</TableHead>
                        <TableHead className="text-cyan-300 hidden sm:table-cell">Người chi</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden sm:table-cell">Số người</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden sm:table-cell">Tiền/người</TableHead>
                        <TableHead className="text-center text-cyan-300 hidden lg:table-cell">Thành viên</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <React.Fragment key={item.stt}>
                          <TableRow className="hover:bg-gray-800/50">
                            <TableCell className="font-medium text-gray-400">{item.stt}</TableCell>
                            <TableCell className="text-gray-200">{item.description}</TableCell>
                            <TableCell className="text-right font-semibold text-cyan-400">
                              {formatVND(item.amount)}
                            </TableCell>
                            <TableCell className="text-gray-300 hidden sm:table-cell">{item.person}</TableCell>
                            <TableCell className="text-right text-gray-400 hidden sm:table-cell">{item.count}</TableCell>
                            <TableCell className="text-right text-gray-400 hidden sm:table-cell">
                              {formatVND(item.perPerson)}
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              <div className="flex justify-center gap-1">
                                {MEMBER_KEYS.map((key) => (
                                  <span key={key} className="inline-block" title={MEMBER_NAMES[MEMBER_KEYS.indexOf(key)]}>
                                    {getParticipationCell((item as any)[key])}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => toggleRow(item.stt)}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                              >
                                {expandedRows.has(item.stt) ? (
                                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                                )}
                              </button>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(item.stt) && (
                            <TableRow className="bg-gray-800/50">
                              <TableCell colSpan={8} className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {getMemberDetails(item)}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                      <TableRow className="bg-cyan-950/50 font-bold">
                        <TableCell colSpan={3} className="text-right pr-4 text-cyan-300">TỔNG CỘNG:</TableCell>
                        <TableCell className="text-right text-cyan-400 text-lg font-bold col-span-full sm:col-span-1">
                          {formatVND(data.total)}
                        </TableCell>
                        <TableCell colSpan={4} className="hidden sm:table-cell"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Member Summary Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">💰 Tổng hợp theo thành viên</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-950/50 hover:bg-cyan-950/50">
                        <TableHead className="text-cyan-300 min-w-[100px]">Thành viên</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền cuối phải trả</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden sm:table-cell">Số tiền đóng quỹ</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden sm:table-cell">Số tiền đã chi/ứng trước</TableHead>
                        <TableHead className="text-right text-cyan-300">Tổng chi phí</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.members.map((member, idx) => (
                        <TableRow key={member.name} className={idx % 2 === 0 ? 'bg-gray-800/30' : ''}>
                          <TableCell className="font-semibold text-cyan-300">{member.name}</TableCell>
                          <TableCell className="text-right text-gray-200">{formatVND(member.toPay)}</TableCell>
                          <TableCell className="text-right text-gray-400 hidden sm:table-cell">{formatVND(member.fundContribution)}</TableCell>
                          <TableCell className="text-right text-gray-400 hidden sm:table-cell">{formatVND(member.advancePayment)}</TableCell>
                          <TableCell className="text-right font-semibold text-cyan-400">{formatVND(member.totalExpense)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
