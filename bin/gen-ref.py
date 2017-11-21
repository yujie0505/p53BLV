import argparse
import re

if '__main__' == __name__:
    parser = argparse.ArgumentParser()
    parser.add_argument('fna', help='specify the path to the .fna file')
    parser.add_argument('gbff', help='specify the path to the .gbff file')
    parser.add_argument('output', help='specify the path to the directory for output files')

    opt = parser.parse_args()

    # build human_nm_rna.fna

    fna = open(opt.fna, 'r').read()

    human_nm_rna = open(opt.output + 'human_nm_rna.fna', 'w')

    for match in re.findall('(>NM_\d+).*?\n([A-Z\n]+)', fna):
        human_nm_rna.write('%s\n%s\n' % (match[0], re.sub('\n', '', match[1])))

    # build human_nm_rna_region.coord and RNA.gtf

    gbff = open(opt.gbff, 'r').read()

    human_nm_rna_region = open(opt.output + 'human_nm_rna_region.coord', 'w')

    RNA = open(opt.output + 'RNA.gtf', 'w')

    for match in re.findall('LOCUS\s+(NM_\d+)[\s\S]*?FEATURES[\s\S]*?gene\s+([\d.]+)[\s\S]*?\/gene="(.+)"[\s\S]*?CDS\s+(?:join\()?([\d.]+)', gbff):
        human_nm_rna_region.write('%s %s %s %s\n' % (match[0], match[2], match[1], match[3]))

        transcript_region = match[1].split('..')
        CDS = match[3].split('..')

        RNA.write('%s\tNCBI\texon\t%s\t%s\t.\t+\t.\tgene_id "%s"; gene_name "%s"; transcript_id "%s"; tss_id "%s";\n' % (match[0], transcript_region[0], transcript_region[1], match[2], match[2], match[0], match[0]))

        RNA.write('%s\tNCBI\tCDS\t%s\t%s\t.\t+\t.\tgene_id "%s"; gene_name "%s"; transcript_id "%s"; tss_id "%s";\n' % (match[0], CDS[0], CDS[1], match[2], match[2], match[0], match[0]))

        RNA.write('%s\tNCBI\tstart_codon\t%s\t%d\t.\t+\t.\tgene_id "%s"; gene_name "%s"; transcript_id "%s"; tss_id "%s";\n' % (match[0], CDS[0], (int(CDS[0]) + 2), match[2], match[2], match[0], match[0]))

        RNA.write('%s\tNCBI\tstop_codon\t%d\t%s\t.\t+\t.\tgene_id "%s"; gene_name "%s"; transcript_id "%s"; tss_id "%s";\n' % (match[0], (int(CDS[1]) - 2), CDS[1], match[2], match[2], match[0], match[0]))
