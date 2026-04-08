import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExpenseData } from '@/hooks/use-expense-data';
import { formatVND, formatShort } from '@/lib/google-sheets-expense-fetcher';
import { Loader2 } from 'lucide-react';
import { Check, X } from 'lucide-react';

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

  // Truncate description to 15 chars for mobile
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full !max-w-[85vw] max-h-[90vh] overflow-hidden flex flex-col bg-gray-900 border-cyan-500/30" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl text-cyan-400">📊 Chi tiêu team #mlace</DialogTitle>
        </DialogHeader>

        {/* Custom scrollbar styles for mobile */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
          /* Hide vertical scrollbar by default, show on hover for mobile */
          @media (max-width: 768px) {
            .custom-scrollbar-y::-webkit-scrollbar-thumb {
              background: transparent;
            }
            .custom-scrollbar-y:hover::-webkit-scrollbar-thumb {
              background: #334155;
            }
          }
        `}</style>

        <div className="flex-1 overflow-auto custom-scrollbar custom-scrollbar-y lg:custom-scrollbar">
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
                <div className="overflow-x-auto custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-cyan-950/50 hover:bg-cyan-950/50">
                        <TableHead className="w-12 text-cyan-300">STT</TableHead>
                        <TableHead className="text-cyan-300 min-w-[120px]">Nội dung chi</TableHead>
                        <TableHead className="text-right text-cyan-300">Số tiền</TableHead>
                        <TableHead className="text-cyan-300 hidden md:table-cell">Người chi</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden md:table-cell">Số người</TableHead>
                        <TableHead className="text-right text-cyan-300 hidden md:table-cell">Tiền/người</TableHead>
                        {/* Desktop: Show all member columns */}
                        {MEMBER_NAMES.map(member => (
                          <TableHead key={member} className="text-center text-cyan-300 hidden lg:table-cell">{member}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <React.Fragment key={item.stt}>
                          <TableRow
                            className={`lg:hover:bg-gray-800/50 ${expandedRows.has(item.stt) ? 'bg-cyan-950/30' : ''}`}
                            onClick={(e) => {
                              // Only enable click-to-expand on mobile (not on desktop)
                              if (window.innerWidth < 1024) {
                                e.stopPropagation();
                                toggleRow(item.stt);
                              }
                            }}
                          >
                            <TableCell className="font-medium text-gray-400 lg:cursor-default cursor-pointer">{item.stt}</TableCell>
                            <TableCell
                              className="text-gray-200 lg:cursor-default cursor-pointer"
                              title={item.description}
                            >
                              {/* Mobile: truncate to 15 chars, Desktop: full text */}
                              <span className="block lg:hidden">{truncateText(item.description, 15)}</span>
                              <span className="hidden lg:inline">{item.description}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-cyan-400 lg:cursor-default cursor-pointer">
                              {formatVND(item.amount)}
                            </TableCell>
                            <TableCell className="text-gray-300 hidden md:table-cell lg:cursor-default cursor-pointer">{item.person}</TableCell>
                            <TableCell className="text-right text-gray-400 hidden md:table-cell lg:cursor-default cursor-pointer">{item.count}</TableCell>
                            <TableCell className="text-right text-gray-400 hidden md:table-cell lg:cursor-default cursor-pointer">
                              {formatVND(item.perPerson)}
                            </TableCell>
                            {/* Desktop: Show all member participation - each in separate cell */}
                            {MEMBER_KEYS.map((key, idx) => {
                              const value = (item as unknown as Record<string, boolean | number>)[key];
                              return (
                                <TableCell key={key} className="text-center hidden lg:table-cell" title={MEMBER_NAMES[idx]}>
                                  {getParticipationCell(value)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                          {/* Mobile: Expanded row with member details */}
                          {expandedRows.has(item.stt) && (
                            <TableRow className="bg-gray-800/50">
                              <TableCell colSpan={8} className="p-0">
                                <div className="border-t border-gray-700">
                                  {/* Member details - one per row, aligned with table columns */}
                                  {MEMBER_KEYS.map((key, idx) => {
                                    const value = (item as unknown as Record<string, boolean | number>)[key];
                                    return (
                                      <div key={key} className="flex items-center py-2">
                                        {/* Empty space for STT column */}
                                        <div className="w-8 flex-shrink-0"></div>
                                        {/* Name takes up description space */}
                                        <div className="flex-1 pr-4">
                                          <span className="text-gray-400">{MEMBER_NAMES[idx]}</span>
                                        </div>
                                        {/* Amount aligned with "Số tiền" column */}
                                        <div className="text-right flex-shrink-0 min-w-[80px]">
                                          <span className="text-cyan-400">{getParticipationCell(value)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                      <TableRow className="bg-cyan-950/50 font-bold">
                        <TableCell colSpan={3} className="text-right pr-4 text-cyan-300">TỔNG CỘNG:</TableCell>
                        <TableCell className="text-right text-cyan-400 text-lg font-bold col-span-full md:col-span-1">
                          {formatVND(data.total)}
                        </TableCell>
                        {/* Desktop: Empty cells for member columns */}
                        {MEMBER_NAMES.map((name) => (
                          <TableCell key={name} className="hidden lg:table-cell"></TableCell>
                        ))}
                        <TableCell className="lg:hidden"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Member Summary Table */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">💰 Tổng hợp theo thành viên</h3>
                <div className="overflow-x-auto custom-scrollbar">
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
